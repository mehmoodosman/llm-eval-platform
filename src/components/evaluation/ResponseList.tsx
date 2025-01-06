"use client";

interface Response {
  model: string;
  response: string;
  error?: string;
}

interface ResponseListProps {
  responses: Response[];
}

export function ResponseList({ responses }: ResponseListProps) {
  if (responses.length === 0) return null;

  return (
    <div className="mt-6 space-y-4">
      {responses.map((response, index) => (
        <div
          key={index}
          className="p-4 rounded-lg bg-black/50 border border-white/10"
        >
          <h3 className="text-sm font-medium text-white/90 mb-2">
            {response.model}
          </h3>
          {response.error ? (
            <p className="text-red-400 text-sm">{response.error}</p>
          ) : (
            <p className="text-white/80 text-sm whitespace-pre-wrap">
              {response.response}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
