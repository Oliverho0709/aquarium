type FishPreviewProps = {
  svgMarkup: string;
  label?: string;
};

export function FishPreview({ svgMarkup, label = "Fish preview" }: FishPreviewProps) {
  return (
    <div className="fish-preview" aria-label={label}>
      <div dangerouslySetInnerHTML={{ __html: svgMarkup }} />
    </div>
  );
}
