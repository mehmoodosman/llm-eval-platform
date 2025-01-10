# LLM Evaluation Platform

## Main features:

- Set up experiments with a unique system prompt and multiple LLM models
- Evaluate the responses from the LLM models with certain metrics such as exact match, LLM judge, cosine similarity, etc. (more to come!)
- Streaming responses from the LLM models to the frontend
- Upload a json file with test cases to evaluate the overall performance of the LLM models and see which one is the best
- Compare the response times, time to first token, tokens per second for each model using my own NPM library [llm-chain!](https://github.com/faizancodes/llm-chain)
- Visualize the results with graphs

# Screenshots

![Screenshot 2025-01-09 at 7 31 51 PM](https://github.com/user-attachments/assets/cb89e329-b722-4055-b593-cdb2c3d4287c)

![Screenshot 2025-01-09 at 7 24 29 PM](https://github.com/user-attachments/assets/e68b9752-1a32-424b-a224-0efe7127982b)

![Screenshot 2025-01-09 at 7 23 45 PM](https://github.com/user-attachments/assets/f98ab6db-b663-457f-9053-89aafbe4af15)

![Screenshot 2025-01-09 at 7 38 44 PM](https://github.com/user-attachments/assets/d3777504-c693-42fc-af9e-3fe0cf086f7c)

# Running Locally

1. First, clone the repository and install the dependencies:

```bash
git clone https://github.com/faizancodes/llm-eval-platform.git
cd llm-eval-platform
npm install
```

2. Set up the environment variables in the .env file.

- Groq and Google are both free to use. OpenAI does require a paid account, so you would like to use this app without it, you can remove the OPENAI_API_KEY from the env.ts file and make other modifications to the codebase as necessary.
- The database URL is provided by Neon. You can sign up for a free account [here](https://neon.tech/home).

```bash
OPENAI_API_KEY=""
GROQ_API_KEY=""
GOOGLE_API_KEY=""
DATABASE_URL=""
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

3. Then, run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
