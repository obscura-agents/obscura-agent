import { describe, it, expect } from "vitest";
import { VectorStore } from "../../src/rag/store";

describe("VectorStore", () => {
  it("returns the nearest documents by cosine similarity", () => {
    const store = new VectorStore();
    store.add("a", "apple text", [1, 0]);
    store.add("b", "banana text", [0, 1]);
    const hits = store.query([0.9, 0.1], 1);
    expect(hits[0].id).toBe("a");
    expect(hits[0].text).toBe("apple text");
  });
});
