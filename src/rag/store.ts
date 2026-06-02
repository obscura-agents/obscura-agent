export interface StoredDoc {
  id: string;
  text: string;
  vector: number[];
}

export interface Hit {
  id: string;
  text: string;
  score: number;
}

function cosine(a: number[], b: number[]): number {
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export class VectorStore {
  private docs: StoredDoc[] = [];

  add(id: string, text: string, vector: number[]): void {
    this.docs.push({ id, text, vector });
  }

  query(vector: number[], k = 5): Hit[] {
    return this.docs
      .map((d) => ({ id: d.id, text: d.text, score: cosine(vector, d.vector) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }

  size(): number {
    return this.docs.length;
  }
}
