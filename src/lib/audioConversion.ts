// Este util foi desativado: a conversão cliente via FFmpeg está instável
// e o WhatsApp exige formatos específicos (audio/ogg;codecs=opus, etc).
// Mantemos o arquivo apenas para referência futura.

export async function convertToOggOpus(input: Blob): Promise<Blob> {
  // No momento não realizamos conversão automática.
  // Apenas retornamos o blob original.
  return input;
}
