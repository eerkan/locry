import { Injectable } from '@angular/core';
import { fromBase64Url, randomBytes, toBase64Url, toBytes } from '../crypto/bytes';

/** Error codes surfaced to the UI (translated under `errors.passkey.*`). */
export type PasskeyErrorCode =
  | 'unsupported'
  | 'prfUnsupported'
  | 'cancelled'
  | 'unknownCredential'
  | 'alreadyRegistered'
  | 'invalidDomain'
  | 'failed';

export class PasskeyError extends Error {
  constructor(
    readonly code: PasskeyErrorCode,
    cause?: unknown,
  ) {
    super(`Passkey error: ${code}`, { cause });
  }
}

/** WebAuthn relying-party ID of this page: its host name, e.g. "localhost". */
export function currentRpId(): string {
  return location.hostname;
}

export interface PasskeyRegistration {
  credentialId: string;
  /** Site the passkey was created for. */
  rpId: string;
  prfOutput: Uint8Array<ArrayBuffer>;
}

export interface PasskeyAssertion {
  credentialId: string;
  prfOutput: Uint8Array<ArrayBuffer>;
}

// The PRF extension types are not in every TS DOM lib version, so describe the parts we use.
interface PrfValues {
  first: BufferSource;
  second?: BufferSource;
}
interface PrfInputs {
  eval?: PrfValues;
}
interface PrfOutputs {
  enabled?: boolean;
  results?: { first: ArrayBuffer; second?: ArrayBuffer };
}

export function isWebAuthnAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.PublicKeyCredential && !!navigator.credentials;
}

/**
 * Creates a discoverable passkey with the PRF extension enabled and returns its PRF output.
 * Some authenticators only report `prf.enabled` at creation; in that case we immediately run
 * an assertion with the new credential to obtain the PRF output.
 */
export async function registerPasskey(options: {
  userName: string;
  displayName: string;
  prfSalt: string;
  /** Credentials already in the vault; the authenticator refuses to create a duplicate. */
  excludeCredentialIds?: string[];
}): Promise<PasskeyRegistration> {
  if (!isWebAuthnAvailable()) throw new PasskeyError('unsupported');

  const salt = fromBase64Url(options.prfSalt);
  let credential: PublicKeyCredential;
  try {
    credential = (await navigator.credentials.create({
      publicKey: {
        rp: { name: 'Locry', id: currentRpId() },
        user: { id: randomBytes(16), name: options.userName, displayName: options.displayName },
        // No server verifies the attestation; the challenge only satisfies the API.
        challenge: randomBytes(32),
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 },
        ],
        authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
        excludeCredentials: (options.excludeCredentialIds ?? []).map((id) => ({
          type: 'public-key' as const,
          id: fromBase64Url(id),
        })),
        attestation: 'none',
        extensions: { prf: { eval: { first: salt } } } as AuthenticationExtensionsClientInputs,
      },
    })) as PublicKeyCredential;
  } catch (error) {
    throw toPasskeyError(error);
  }

  const prf = prfOutputs(credential);
  if (!prf?.enabled && !prf?.results) throw new PasskeyError('prfUnsupported');

  const credentialId = toBase64Url(credential.rawId);
  if (prf.results?.first) {
    return { credentialId, rpId: currentRpId(), prfOutput: toBytes(prf.results.first) };
  }

  const assertion = await assertPasskey({ prfSalt: options.prfSalt, credentialIds: [credentialId] });
  return { credentialId, rpId: currentRpId(), prfOutput: assertion.prfOutput };
}

/** Asks the user to authenticate with one of the given passkeys and returns the PRF output. */
export async function assertPasskey(options: {
  prfSalt: string;
  credentialIds: string[];
}): Promise<PasskeyAssertion> {
  if (!isWebAuthnAvailable()) throw new PasskeyError('unsupported');

  let credential: PublicKeyCredential;
  try {
    credential = (await navigator.credentials.get({
      publicKey: {
        rpId: currentRpId(),
        challenge: randomBytes(32),
        userVerification: 'required',
        allowCredentials: options.credentialIds.map((id) => ({
          type: 'public-key',
          id: fromBase64Url(id),
        })),
        extensions: {
          prf: { eval: { first: fromBase64Url(options.prfSalt) } } satisfies PrfInputs,
        } as AuthenticationExtensionsClientInputs,
      },
    })) as PublicKeyCredential;
  } catch (error) {
    throw toPasskeyError(error);
  }

  const first = prfOutputs(credential)?.results?.first;
  if (!first) throw new PasskeyError('prfUnsupported');
  return { credentialId: toBase64Url(credential.rawId), prfOutput: toBytes(first) };
}

function prfOutputs(credential: PublicKeyCredential): PrfOutputs | undefined {
  return (credential.getClientExtensionResults() as { prf?: PrfOutputs }).prf;
}

function toPasskeyError(error: unknown): PasskeyError {
  if (error instanceof PasskeyError) return error;
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError' || error.name === 'AbortError') {
      return new PasskeyError('cancelled', error);
    }
    if (error.name === 'NotSupportedError') return new PasskeyError('unsupported', error);
    if (error.name === 'InvalidStateError') return new PasskeyError('alreadyRegistered', error);
    // e.g. the app was opened on an IP address such as 127.0.0.1 instead of localhost.
    if (error.name === 'SecurityError') return new PasskeyError('invalidDomain', error);
  }
  return new PasskeyError('failed', error);
}

/** Injectable wrapper around the WebAuthn calls, so tests can substitute a fake authenticator. */
@Injectable({ providedIn: 'root' })
export class PasskeyClient {
  register(options: Parameters<typeof registerPasskey>[0]): Promise<PasskeyRegistration> {
    return registerPasskey(options);
  }

  assert(options: Parameters<typeof assertPasskey>[0]): Promise<PasskeyAssertion> {
    return assertPasskey(options);
  }
}
