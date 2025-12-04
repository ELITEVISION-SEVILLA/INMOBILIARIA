import { GoogleGenAI } from "@google/genai";

// Función segura para obtener la API Key en diferentes entornos (Vite, Next.js, Webpack, Browser)
const getApiKey = () => {
  try {
    // Intento 1: Vite (Estándar moderno)
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
      // @ts-ignore
      return import.meta.env.VITE_API_KEY;
    }
  } catch (e) {}

  try {
    // Intento 2: Node/Webpack/Create-React-App
    // Verificamos typeof process para evitar crash en navegadores puros
    if (typeof process !== 'undefined' && process.env) {
      if (process.env.API_KEY) return process.env.API_KEY;
      if (process.env.REACT_APP_API_KEY) return process.env.REACT_APP_API_KEY;
    }
  } catch (e) {}

  return '';
};

const apiKey = getApiKey();

// Initialize the client safely
let ai: GoogleGenAI | null = null;

// Solo inicializamos si hay key, pero NO lanzamos error para no romper la app entera si falta
if (apiKey) {
  try {
    ai = new GoogleGenAI({ apiKey });
  } catch (error) {
    console.error("Failed to initialize Gemini client:", error);
  }
} else {
  console.warn("Gemini API Key no encontrada. La funcionalidad de IA estará desactivada.");
}

export const generateEmailDraft = async (
  tenantName: string,
  topic: string,
  context: string
): Promise<string> => {
  if (!ai) {
    return "Error: API Key de Google no configurada o inválida. Verifica tus variables de entorno en Vercel.";
  }

  const prompt = `
    Actúa como un gestor inmobiliario profesional y educado.
    Redacta un correo electrónico formal dirigido al inquilino: ${tenantName}.
    
    Tema principal: ${topic}
    Contexto adicional: ${context}
    
    El tono debe ser firme pero cordial. Estructura el correo con Asunto y Cuerpo.
    No uses marcadores de posición, genera el texto completo.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text || "No se pudo generar el texto.";
  } catch (error) {
    console.error("Error generating content:", error);
    return "Ocurrió un error al contactar con la IA. Por favor intenta más tarde.";
  }
};

export const analyzeReceiptImage = async (base64Image: string): Promise<any> => {
  if (!ai) {
    throw new Error("API Key no configurada");
  }

  // Eliminar prefijo de data URL si existe (ej: "data:image/jpeg;base64,")
  const base64Data = base64Image.split(',')[1] || base64Image;

  const prompt = `
    Analiza esta imagen de una factura o recibo.
    Extrae la siguiente información en formato JSON puro (sin markdown):
    
    {
      "amount": (número, usa punto para decimales),
      "date": (string en formato YYYY-MM-DD, si no hay fecha usa la de hoy),
      "description": (resumen corto de 3-5 palabras del concepto),
      "category": (Elige EXACTAMENTE UNA de estas: "Reparación", "Comunidad", "Seguro", "Impuestos", "Otros")
    }

    Si no puedes leer la imagen, devuelve un JSON con valores vacíos o estimados.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: 'image/jpeg', data: base64Data } }
        ]
      }
    });

    const text = response.text || "{}";
    // Limpieza básica por si la IA devuelve bloques de código markdown
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Error analyzing receipt:", error);
    throw error;
  }
};