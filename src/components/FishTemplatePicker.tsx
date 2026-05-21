import { fishTemplates } from "../assets/fishTemplates";

type FishTemplatePickerProps = {
  selectedTemplateId: string;
  onChange: (templateId: string) => void;
};

export function FishTemplatePicker({ selectedTemplateId, onChange }: FishTemplatePickerProps) {
  return (
    <div className="template-grid">
      {fishTemplates.map((template) => (
        <button
          className={template.id === selectedTemplateId ? "template-card selected" : "template-card"}
          key={template.id}
          onClick={() => onChange(template.id)}
          type="button"
        >
          <strong>{template.name}</strong>
          <span>{template.description}</span>
        </button>
      ))}
    </div>
  );
}
