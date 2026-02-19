import { json } from "@sveltejs/kit";
import { d as db, r as rooms } from "../../../../../chunks/index3.js";
function generateCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
const POST = async () => {
  let code = generateCode();
  let attempts = 0;
  while (attempts < 5) {
    try {
      await db.insert(rooms).values({
        id: code,
        seed: Math.random().toString(36).substring(7),
        // Initial random seed
        status: "LOBBY"
      });
      break;
    } catch (e) {
      code = generateCode();
      attempts++;
    }
  }
  if (attempts >= 5) {
    return json({ error: "Failed to generate room code" }, { status: 500 });
  }
  return json({ code });
};
export {
  POST
};
