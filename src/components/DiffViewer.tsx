import ReactDiffViewer from "react-diff-viewer-continued";

/** Strip trailing commas from JSON lines so adding a new last property
 *  doesn't cause a spurious diff on the previous line. */
function normalizeJsonForDiff(text: string): string {
  return text
    .split("\n")
    .map((line) => line.replace(/,(\s*)$/, "$1"))
    .join("\n");
}

export function DiffViewer({
  oldValue,
  newValue,
}: {
  oldValue: string;
  newValue: string;
}) {
  return (
    <div className="max-h-[400px] overflow-auto rounded-lg border">
      <ReactDiffViewer
        oldValue={normalizeJsonForDiff(oldValue)}
        newValue={normalizeJsonForDiff(newValue)}
        splitView={false}
        hideLineNumbers={false}
        showDiffOnly={true}
        extraLinesSurroundingDiff={3}
      />
    </div>
  );
}
