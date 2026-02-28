# 整合 ChatGPT OAuth 的說明與範例

這份文件說明了 `openclaw` 專案如何能夠「不使用付費 API Key，而是透過 OAuth 的方式」來調用 ChatGPT 的 LLM 模型，以及您如何在自己的專案中實作相同的功能。

## 這是如何運作的？

這個專案依賴了一個名為 `@mariozechner/pi-ai` 的開源函式庫，這個函式庫內部實作了：
1. **OAuth 登入流程（`loginOpenAICodex`）**：在本地端開啟一個短暫的 HTTP Server (通常在 port 1455)，然後引導使用者在瀏覽器打開 ChatGPT 的登入頁面。當使用者登入成功後，ChatGPT 會將包含 Access Token 的憑證重新導向到本地的 Server。
2. **通訊協定轉換**：一旦拿到了使用者的 Access Token（這個 Token 屬於使用者的個人 ChatGPT 帳號或 Plus 訂閱），`@mariozechner/pi-ai` 會將對 `openai-codex/gpt-4o` 模型的請求，轉換成 ChatGPT 網頁版或官方 App 在背後使用的私有 API 格式。這樣一來，就可以用個人帳號的配額來呼叫模型，而不需要開發者平台的付費 API Key。

## 獨立的 Function 範例

我們已將此流程獨立出來放在 `scripts/openai-codex-oauth-example.ts` 檔案中，您可以將這個檔案當作參考，移植到您自己的專案。

### 核心程式碼範例

```typescript
import { loginOpenAICodex } from "@mariozechner/pi-ai";
import { streamSimple } from "@mariozechner/pi-ai";

async function useChatGPTWithOAuth() {
  // 1. 執行 OAuth 登入流程
  const creds = await loginOpenAICodex({
    onAuth: (info) => {
      // 提示使用者去瀏覽器打開這個網址
      console.log(`請在瀏覽器開啟此網址來登入 ChatGPT:\n${info.url}`);
    },
    onPrompt: async (prompt) => {
      return "";
    },
    onProgress: (msg) => {
      console.log(`進度: ${msg}`);
    },
  });

  // 取得的 access token 就可以當作 API Key 使用
  const apiKey = creds.access;

  // 2. 呼叫 ChatGPT 模型 (例如 openai-codex/gpt-4o)
  const stream = streamSimple("openai-codex/gpt-4o", [
    { role: "user", text: "你好，請說個笑話！" }
  ], {
    apiKey: apiKey, // 傳入剛剛拿到的 token
  });

  // 接收串流回應
  for await (const chunk of stream) {
    process.stdout.write(chunk);
  }
}
```

## 如何在您的專案中使用

如果您的專案是 Node.js 環境，您可以：
1. 直接安裝並使用 `@mariozechner/pi-ai` 套件（`npm install @mariozechner/pi-ai`）。
2. 在您的程式中引入 `loginOpenAICodex` 並取得 Token。
3. 接著，您可以直接使用該套件的 `streamSimple`、`completeSimple` 來向模型發送訊息，它會在底層幫您處理與 ChatGPT 伺服器之間的通訊。

> **注意：** 這種透過 OAuth 調用非公開 API 的方式，依賴於 OpenAI 未公開的內部端點。雖然在個人專案中非常方便且節省成本，但它可能會隨著 OpenAI 網站的改版而失效，較不適合用在生產環境（Production）的商業產品中。
