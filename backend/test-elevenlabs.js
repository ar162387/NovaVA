import axios from 'axios';
import { config } from './config.js';

// Test ElevenLabs TTS directly
async function testElevenLabsTTS() {
  console.log('🧪 Testing ElevenLabs TTS...');
  
  const { elevenlabs } = config;
  
  if (!elevenlabs.apiKey) {
    console.error('❌ ElevenLabs API key not configured');
    return;
  }

  try {
    console.log('🎤 Making ElevenLabs TTS request...');
    console.log('API Key:', elevenlabs.apiKey.substring(0, 10) + '...');
    console.log('Voice ID:', elevenlabs.defaultVoice.voiceId);
    console.log('Model:', elevenlabs.defaultVoice.model);
    
    const response = await axios.post(
      `${elevenlabs.baseUrl}/text-to-speech/${elevenlabs.defaultVoice.voiceId}`,
      {
        text: "Hello, this is a test of the ElevenLabs TTS integration.",
        model_id: elevenlabs.defaultVoice.model,
        voice_settings: elevenlabs.defaultVoice.settings
      },
      {
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': elevenlabs.apiKey
        },
        responseType: 'arraybuffer',
        timeout: 30000
      }
    );

    console.log('✅ Response status:', response.status);
    console.log('📊 Response size:', response.data.byteLength, 'bytes');
    console.log('🎵 Content type:', response.headers['content-type']);

    if (response.status === 200 && response.data) {
      // Convert ArrayBuffer to Base64 data URL
      const audioBuffer = Buffer.from(response.data);
      const base64Audio = audioBuffer.toString('base64');
      const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;
      
      console.log('✅ ElevenLabs TTS audio generated successfully');
      console.log(`📊 Audio size: ${(audioBuffer.length / 1024).toFixed(2)} KB`);
      console.log('🔗 Audio URL length:', audioUrl.length);
      console.log('🔗 Audio URL preview:', audioUrl.substring(0, 50) + '...');
      
      return {
        success: true,
        audioUrl: audioUrl,
        audioSize: audioBuffer.length,
        provider: 'elevenlabs'
      };
    } else {
      console.error('❌ ElevenLabs API returned unsuccessful response:', response.status);
      return { success: false, error: `ElevenLabs API error: ${response.status}` };
    }
  } catch (error) {
    console.error('❌ ElevenLabs TTS generation failed:', error.message);
    
    if (error.response) {
      console.error('📋 ElevenLabs API response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data?.toString?.() || 'No response data'
      });
    }
    
    return { 
      success: false, 
      error: error.response?.data?.detail || error.message 
    };
  }
}

// Run test
testElevenLabsTTS().then(result => {
  console.log('🧪 Test result:', result);
}).catch(error => {
  console.error('🔴 Test failed:', error);
}); 