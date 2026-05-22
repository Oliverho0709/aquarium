import { useId, useMemo } from "react";
import { namespaceSvgIds } from "../utils/svg";

type FishPreviewProps = {
  svgMarkup: string;
  label?: string;
};

export function FishPreview({ svgMarkup, label = "Fish preview" }: FishPreviewProps) {
  const reactId = useId();
  const prefix = `p${reactId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const namespaced = useMemo(() => namespaceSvgIds(svgMarkup, prefix), [svgMarkup, prefix]);
  return (
    <div className="fish-preview" aria-label={label}>
      <div dangerouslySetInnerHTML={{ __html: namespaced }} />
    </div>
  );
}
