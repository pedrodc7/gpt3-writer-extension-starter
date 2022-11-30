const getKey = () => {
   return new Promise((resolve, reject) => {
      chrome.storage.local.get(["openai-key"], (result) => {
         if (result["openai-key"]) {
            const decodeKey = atob(result["openai-key"]);
            resolve(decodeKey);
         }
      });
   });
};

const sendMessage = (content) => {
    
   chrome.tabs.query({ active: true }, (tabs) => {
      const activeTab = tabs[0].id;

      chrome.tabs.sendMessage(
         activeTab,
         { message: "inject", content },
         (response) => {
            if (response.status === "failed") {
               console.log("injection failed.");
            }
         }
      );
   });
};

const generate = async (prompt) => {
   const key = await getKey();
   const url = "https://api.openai.com/v1/completions";

   const completionResponse = await fetch(url, {
      method: "POST",
      headers: {
         "Content-Type": "application/json",
         Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
         model: "text-davinci-003",
         prompt: prompt,
         max_tokens: 1250,
         temperature: 0.7,
      }),
   });
   const completion = await completionResponse.json();
   return completion.choices.pop();
};

const generateCompletionAction = async (info) => {
   try {
      sendMessage("generating ...");

      const { selectionText } = info;
      console.log(selectionText);
      const basePromptPrefix = `
        Give me he 5 key tasks to accomplish the project with the title below.

        Title:
        `;
      const baseCompletion = await generate(
         `${basePromptPrefix}${selectionText}`
      );
     sendMessage(baseCompletion.text);
      console.log(baseCompletion.text);
   } catch (error) {
      console.log(error);
      endMessage(error.toString());
   }
};

chrome.contextMenus.create({
   id: "context-run",
   title: "Create tasks",
   contexts: ["selection"],
});

// Add listener
chrome.contextMenus.onClicked.addListener(generateCompletionAction);
