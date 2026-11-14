
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM

MODEL_NAME = "microsoft/DialoGPT-small"

device = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

print("Device:", device)

if torch.cuda.is_available():
    print("GPU:", torch.cuda.get_device_name(0))

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

model = AutoModelForCausalLM.from_pretrained(MODEL_NAME)

model.to(device)
model.eval()

chat_history_ids = None

MAX_HISTORY_TOKENS = 500

print("\nChatbot ready!")
print("Type 'exit' to stop.")
print("Type 'reset' to clear conversation.")

while True:

    user_input = input("\nYou: ").strip()

    if user_input.lower() == "exit":
        break

    if user_input.lower() == "reset":
        chat_history_ids = None
        print("Conversation reset.")
        continue

    if not user_input:
        continue

    new_input_ids = tokenizer.encode(
        user_input + tokenizer.eos_token,
        return_tensors="pt"
    ).to(device)

    if chat_history_ids is not None:

        bot_input_ids = torch.cat(
            [chat_history_ids, new_input_ids],
            dim=-1
        )

    else:
        bot_input_ids = new_input_ids

    # Keep only recent conversation history
    bot_input_ids = bot_input_ids[:, -MAX_HISTORY_TOKENS:]

    with torch.no_grad():

        output_ids = model.generate(
            bot_input_ids,
            max_new_tokens=60,
            pad_token_id=tokenizer.eos_token_id,
            eos_token_id=tokenizer.eos_token_id,
            do_sample=True,
            temperature=0.2,
            top_k=40,
            top_p=0.85,
            repetition_penalty=1.3,
            no_repeat_ngram_size=3
        )

    response_ids = output_ids[:, bot_input_ids.shape[-1]:]

    response = tokenizer.decode(
        response_ids[0],
        skip_special_tokens=True,
        clean_up_tokenization_spaces=False
    ).strip()

    chat_history_ids = output_ids

    if response:
        print("\nBot:", response)
    else:
        print("\nBot: I didn't get a response. Could you say that again?")
