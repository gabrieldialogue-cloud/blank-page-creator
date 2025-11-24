import LibAVWebCodecs from '@libav.js/variant-webm-vp9';

let libav: any = null;

async function getLibAV() {
  if (!libav) {
    libav = await LibAVWebCodecs.LibAV();
  }
  return libav;
}

export async function convertToOggOpus(inputBlob: Blob): Promise<Blob> {
  // Se já é OGG, retorna direto
  if (inputBlob.type.includes('ogg')) {
    return inputBlob;
  }

  console.log('Iniciando conversão WebM → OGG/Opus com libav.js');

  try {
    const lib = await getLibAV();
    
    // Ler o arquivo de entrada
    const inputData = new Uint8Array(await inputBlob.arrayBuffer());
    await lib.writeFile('input.webm', inputData);
    
    // Criar dispositivo de escrita para capturar output
    await lib.mkwriterdev('output.ogg');
    
    let outputData = new Uint8Array(0);
    lib.onwrite = (name: string, pos: number, data: Uint8Array) => {
      if (name === 'output.ogg') {
        const newLen = Math.max(outputData.length, pos + data.length);
        if (newLen > outputData.length) {
          const newData = new Uint8Array(newLen);
          newData.set(outputData);
          outputData = newData;
        }
        outputData.set(data, pos);
      }
    };
    
    // Converter usando ffmpeg interno do libav
    // -i input.webm: arquivo de entrada
    // -vn: sem vídeo
    // -c:a libopus: codec de áudio Opus
    // -b:a 32k: bitrate baixo para reduzir tamanho
    // -f ogg: formato OGG
    // output.ogg: arquivo de saída
    await lib.ffmpeg(
      '-i', 'input.webm',
      '-vn',
      '-c:a', 'libopus',
      '-b:a', '32k',
      '-f', 'ogg',
      '-y',
      'output.ogg'
    );
    
    // Limpar arquivos temporários
    try {
      await lib.unlink('input.webm');
      await lib.unlink('output.ogg');
    } catch {
      // ignore cleanup errors
    }
    
    console.log('Conversão concluída. Tamanho output:', outputData.length, 'bytes');
    
    return new Blob([outputData], { type: 'audio/ogg' });
  } catch (error) {
    console.error('Erro na conversão libav:', error);
    throw error;
  }
}
