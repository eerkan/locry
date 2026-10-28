import { isSilent } from './dictation.service';
import { speechChunks } from './read-aloud.service';
import { cleanTranscript } from './speech-protocol';

describe('speechChunks', () => {
  it('splits text into sentence-sized pieces under the limit', () => {
    const text = 'Birinci cümle. İkinci cümle burada! Üçüncü mü? Son.';
    expect(speechChunks(text, 30)).toEqual(['Birinci cümle.', 'İkinci cümle burada!', 'Üçüncü mü? Son.']);
  });

  it('splits an overlong sentence at word boundaries and keeps every word', () => {
    const sentence = Array.from({ length: 60 }, (_, i) => `kelime${i}`).join(' ');
    const chunks = speechChunks(sentence, 80);
    expect(chunks.every((c) => c.length <= 80)).toBe(true);
    expect(chunks.join(' ').split(' ')).toEqual(sentence.split(' '));
  });

  it('handles CJK and Arabic punctuation and empty text', () => {
    expect(speechChunks('第一句。第二句！', 4)).toEqual(['第一句。', '第二句！']);
    expect(speechChunks('هل أنت هنا؟ نعم.', 12)).toEqual(['هل أنت هنا؟', 'نعم.']);
    expect(speechChunks('   ')).toEqual([]);
  });
});

describe('dictation helpers', () => {
  it('drops Whisper’s noise tags and extra spaces', () => {
    expect(cleanTranscript(' [BLANK_AUDIO] Süt  al. (music) ')).toBe('Süt al.');
    expect(cleanTranscript('[MUSIC]')).toBe('');
  });

  it('tells silence from speech', () => {
    expect(isSilent(new Float32Array(1000))).toBe(true);
    const speech = new Float32Array(1000).map((_, i) => Math.sin(i / 5) * 0.3);
    expect(isSilent(speech)).toBe(false);
  });
});
