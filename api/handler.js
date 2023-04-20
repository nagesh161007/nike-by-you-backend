require("dotenv").config();
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

async function handler(request, response) {
  const description = request.body.description;
  const count = request.body.count | 8;
  const type = request.body.type;

  if (type == promptTypes.DESCRIPTION) {
    if (!description) {
      response.status(403).json({ erroCode: "BAD_REQUEST" });
    }
  }
  const prompt = getPrompt(description, count, type);
  try {
    const openAiResponse = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: prompt,
      temperature: 0,
      max_tokens: 64,
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
      stop: [";"],
    });
    const generatedText = openAiResponse.data.choices[0].text.trim().replace();
    const regex = /#[0-9a-fA-F]{6}/g;
    const lines = generatedText.split("\n");
    console.log(lines);
    const colors = lines
      .map((line) => {
        if (line.match(regex) && line.match(regex).length > 0) {
          return line.match(regex)[0];
        }
      })
      .filter((color) => {
        return color;
      });

    console.log(colors);

    if (colors.length) {
      return response.status(200).json({ data: { colors: colors } });
    } else {
      throw new Error("Failed to generate a color palette");
    }
  } catch (error) {
    console.log(error);
    response.status(403).json({ error: "GENERATE_COLOR_FAILURE" });
  }
}

function getPrompt(description, count, type) {
  const descriptionPrompt = `Create a color palette based on the following description for nike shoe for the following description: ${description}. Give atleast ${count} colors hex value`;
  const randomColorPrompt = `Create a color palette for nike converse shoe:  Give atleast ${count} colors hex values`;
  console.log(type);
  if (type === "DESCRIPTION") {
    return descriptionPrompt;
  }
  return randomColorPrompt;
}

const promptTypes = {
  DESCRIPTION: "DESCRIPTION",
};

const allowCors = (fn) => async (req, res) => {
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  return await fn(req, res);
};

module.exports = allowCors(handler);
