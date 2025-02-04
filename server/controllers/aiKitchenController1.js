const AIRecipe = require('../models/AI');
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.generateRecipe = async (req, res) => {
  try {
    const { ingredients, preferences } = req.body;
    // Validate inputs
    if (!ingredients || ingredients.length === 0) {
      return res.status(400).json({ error: 'Ingredients are required' });
    }

    // Generate recipe using OpenAI
    const prompt = `Create a detailed recipe using these ingredients: ${ingredients.join(', ')}. 
      Cuisine: ${preferences.cuisine || 'Any'}
      Dietary: ${preferences.dietary || 'None'}
      Difficulty: ${preferences.difficulty || 'Any'}
      Time: ${preferences.time || 'Any'} minutes
      
      Format the response as JSON with the following structure:
      {
        "title": "Recipe Name",
        "servings": number,
        "duration": number (in minutes),
        "difficulty": "easy/medium/hard",
        "ingredients": [{"name": "ingredient", "quantity": "amount", "unit": "measurement"}],
        "instructions": [{"step": 1, "description": "instruction"}],
        "chefNotes": "additional tips"
      }`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a professional chef creating detailed recipes." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    });
    console.log(completion);
    // Parse the AI response
    const generatedRecipe = JSON.parse(completion.choices[0].message.content);
    console.log(generatedRecipe);
    // Save the recipe
    const aiRecipe = await AIRecipe.create({
      ingredients,
      preferences,
      generatedRecipe,
      user: req.user._id
    });

    res.json(aiRecipe);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSavedRecipes = async (req, res) => {
  try {
    const recipes = await AIRecipe.find({ user: req.user._id })
      .sort('-createdAt');
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};