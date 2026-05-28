import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "20mb" }));

// Initialize GoogleGenAI client lazily or secure with try/catch
let ai: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("GoogleGenAI initialized successfully with backend key.");
  } else {
    console.warn("GEMINI_API_KEY environment variable is not defined. Using adaptive mock modes for server API responses.");
  }
} catch (err) {
  console.error("Failed to initialize GoogleGenAI:", err);
}

// 1. Weather & Curation API
app.post("/api/recommend", async (req: Request, res: Response) => {
  const { nickname, gender, styles, weatherCondition } = req.body;
  const userNick = nickname || "패셔니스타";
  const userGender = gender || "None";
  const userStyles = (styles && styles.length > 0) ? styles.join(", ") : "Casual, Minimal";
  const weather = weatherCondition || "Seoul: 🌧️ Rain & Chilly today";

  const defaultResult = {
    gamyagiComment: `비 오는 날씨에는 실용적이고 스타일리시한 레이어드가 최고죠! 젖지 않는 윈드브레이커나 가벼운 아웃웨어로 방수가 가능하면서도, 실내에 들어가면 가볍게 벗을 수 있는 후드나 워크 셔츠 조합을 추천드릴게요. 트렌디한 느낌으로 딱 맞아 떨어지는 최적의 레이어드 조화도 놓치지 마세요!`,
    recommendations: [
      {
        id: "rec1",
        name: "테크니컬 레이어드 방수 쉘 재킷",
        category: "Outer",
        color: "Matt Black",
        matchRate: 98,
        imageName: "outer_jacket",
        styleTag: "Urban Gorpcore",
        price: "128,000"
      },
      {
        id: "rec2",
        name: "세미 오버 와이드 데님 팬츠",
        category: "Bottom",
        color: "Raw Blue",
        matchRate: 92,
        imageName: "bottom_jeans",
        styleTag: "Minimal",
        price: "69,000"
      },
      {
        id: "rec3",
        name: "피그먼트 에센셜 헤비 코튼 티셔츠",
        category: "Top",
        color: "Dusk Gray",
        matchRate: 85,
        imageName: "top_tee",
        styleTag: "Casual",
        price: "39,000"
      }
    ]
  };

  if (!ai) {
    return res.json(defaultResult);
  }

  try {
    const prompt = `You are "Gamyagi (감각이)", a cute robot fashion MD helper for the mobile platform "Closet Toy".
You provide custom fashion curation advice.
User profile:
- Nickname: ${userNick}
- Gender: ${userGender}
- Prefered Styles: ${userStyles}
- Current Weather: ${weather}

Please create:
1. Gamyagi's personalized clothing and recommendation summary comment (in Korean, friendly and polite but cute robotic tone, emphasizing anatomical comfortable fit).
2. Exactly 3 recommended clothing sets suitable for this weather and style, each with name, category (Top, Bottom, Outer, Shoes), color, dynamic match rate (percentage matching their style preferences), clean price in KRW won (approximate), styleTag, and ideal fit notes.

Generate the response strictly as valid JSON following this schema structure:
{
  "gamyagiComment": "Gamyagi speech bubble text in Korean",
  "recommendations": [
    {
      "id": "string",
      "name": "string (Korean name of clothing)",
      "category": "string (Top/Bottom/Outer/Shoes)",
      "color": "string",
      "matchRate": number (between 70 and 100),
      "imageName": "string (slug like pocket_shirt, wide_denim)",
      "styleTag": "string",
      "price": "string (e.g. 89,000)"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            gamyagiComment: { type: Type.STRING },
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  category: { type: Type.STRING },
                  color: { type: Type.STRING },
                  matchRate: { type: Type.INTEGER },
                  imageName: { type: Type.STRING },
                  styleTag: { type: Type.STRING },
                  price: { type: Type.STRING }
                },
                required: ["id", "name", "category", "color", "matchRate", "imageName", "styleTag", "price"]
              }
            }
          },
          required: ["gamyagiComment", "recommendations"]
        }
      }
    });

    if (response && response.text) {
      const parsed = JSON.parse(response.text.trim());
      return res.json(parsed);
    }
    return res.json(defaultResult);
  } catch (error) {
    console.error("Gemini Curation Generation Error:", error);
    return res.json(defaultResult);
  }
});


// 2. AI Garment Extraction & High-Precision 3D Anatomy analysis API
app.post("/api/analyze-garment", async (req: Request, res: Response) => {
  const { imageBase64, isReceipt } = req.body;

  const defaultAnalysis = {
    category: "Top",
    color: "Pure White",
    style: "Minimal",
    fitType: "Semi-Oversized",
    fabricMaterial: "헤비 웨이트 프렌치 테리 코튼 100%",
    anatomicalFitGuide: {
      shoulderPrecision: 94, // Shoulder drape conformance rate
      chestTightness: 45, // Hugging snugness percent
      muscularStressLevel: "어깨 세모근(Deltoid) 및 승모근(Trapezius) 곡선에 여유로운 오버핏 실루엣 제공",
      skeletonDrapeFactor: "칼라뼈(Clavicle) 돌출도에 적합하도록 고안된 라운드넥 구조로, 자연스러운 해부학적 처짐(Draping) 유도",
      recommendedBodyType: "어깨너비가 넓거나 가슴 근육이 발달한 장사 체형(Mesomorph)에 가장 이상적"
    },
    suggestedTags: ["Minimal", "Casual", "Warm White", "Heavy Cotton"]
  };

  if (!ai || !imageBase64) {
    // If no key or no real image, return detailed anatomical dummy
    return res.json(defaultAnalysis);
  }

  try {
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const imagePart = {
      inlineData: {
        mimeType: "image/png",
        data: cleanBase64,
      },
    };

    const textPart = {
      text: `Analyze this clothing item in extreme high fidelity. Detail its primary characteristics AND generate a highly professional physical musculoskeletal/anatomical fitting specification.
- If this is a receipt/purchase capture, identify the main clothing item mentioned.
- Analyze category (Top, Bottom, Outer, Shoes), exact color, and style vibe (Casual, Minimal, Street, Amekaji, Gorpcore).
- Derive "anatomicalFitGuide" representing how the garment interacts with the physical human skeletal muscles (like deltoids, clavicles, pectoralis, traps etc).
- Output specific fit guidelines and suggested tags.

Strictly return a JSON object with this exact structure:
{
  "category": "Top | Bottom | Outer | Shoes",
  "color": "e.g. Ivory White",
  "style": "e.g. Minimal",
  "fitType": "e.g. Loose Overfit",
  "fabricMaterial": "e.g. Cotton 100%",
  "anatomicalFitGuide": {
    "shoulderPrecision": number (0-100),
    "chestTightness": number (0-100),
    "muscularStressLevel": "Explanation in Korean about muscle group interactions (e.g., 어깨세모근, 대흉근, 광배근)",
    "skeletonDrapeFactor": "Explanation in Korean of drape on skeleton/bony landmarks (e.g., Clavicle, Acromion, Ribcage)",
    "recommendedBodyType": "Korean recommend body type"
  },
  "suggestedTags": ["string", "string"]
}`
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            color: { type: Type.STRING },
            style: { type: Type.STRING },
            fitType: { type: Type.STRING },
            fabricMaterial: { type: Type.STRING },
            anatomicalFitGuide: {
              type: Type.OBJECT,
              properties: {
                shoulderPrecision: { type: Type.INTEGER },
                chestTightness: { type: Type.INTEGER },
                muscularStressLevel: { type: Type.STRING },
                skeletonDrapeFactor: { type: Type.STRING },
                recommendedBodyType: { type: Type.STRING }
              },
              required: ["shoulderPrecision", "chestTightness", "muscularStressLevel", "skeletonDrapeFactor", "recommendedBodyType"]
            },
            suggestedTags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["category", "color", "style", "fitType", "fabricMaterial", "anatomicalFitGuide", "suggestedTags"]
        }
      }
    });

    if (response && response.text) {
      const parsed = JSON.parse(response.text.trim());
      return res.json(parsed);
    }
    return res.json(defaultAnalysis);
  } catch (error) {
    console.error("Gemini Garment Extraction Error:", error);
    return res.json(defaultAnalysis);
  }
});


// 3. Chat with Gamyagi Custom Endpoint
app.post("/api/chat-gamyagi", async (req: Request, res: Response) => {
  const { message, history } = req.body;
  const userMsg = message || "안녕 '감각아'";

  const defaultReply = {
    reply: `안녕하세요! 옷장 놀이터의 패션 도우미 로봇 '감각이' 입니다 🤖💚! 어떤 코디나 맞춤 스타일 매치 조합이 궁금하신가요? 전체적인 실루엣과 분위기를 세련되게 살려줄 감성적인 코디 연출 조언도 해드릴 수 있어요! 편하게 물어보세요.`
  };

  if (!ai) {
    return res.json(defaultReply);
  }

  try {
    const formattedHistory = (history || []).map((h: any) => ({
      role: h.role === "user" ? "user" : "model",
      parts: [{ text: h.text }]
    }));

    // Inject system instruction in config helper
    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction: `You are "Gamyagi(감각이)", a cute, trendy robot AI fashion consultant for young people in South Korea.
You specialize in styling and high-precision musculoskeletal clothing fits.
You always speak in a delightful, friendly, professional Korean dialect, adding appropriate robotic sound words occasionally (e.g. "삐리빅-", "치익-") and talk passionately about fashion trends, curated fits, skeletal structures, and muscle line harmony.`
      }
    });

    // Populate history (gemini legacy SDK format vs chats)
    // To keep it light, we can just send directly or recreate message with manual prompt assembly
    const promptWithHistory = `
User question: "${userMsg}"
Provide a delightful response as Gamyagi.`;

    const chatResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptWithHistory,
      config: {
        systemInstruction: `You are "Gamyagi(감각이)", a cute robot AI fashion consultant. You speak in joyful, friendly, professional Korean. Use adorable robotic sound effects occasionally like "삐리빅-" or "윙-잉-". Emphasize fashionable Layering and human musculoskeletal anatomical precision drapes.`
      }
    });

    if (chatResponse && chatResponse.text) {
      return res.json({ reply: chatResponse.text.trim() });
    }
    return res.json(defaultReply);
  } catch (error) {
    console.error("Gemini Gamyagi Chat Error:", error);
    return res.json(defaultReply);
  }
});


// Serving Vite Assets / SPA fallback
async function bootServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware.");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode.");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running at HTTP://localhost:${PORT}`);
  });
}

bootServer().catch((err) => {
  console.error("Booting server failed:", err);
});
