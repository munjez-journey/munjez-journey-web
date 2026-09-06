import FormCard from "../../../_components/FormCard";
import SectionForm from "../../../_components/SectionForm";
import { sections } from "../../../_lib/sections";

export default function NewSectionItemPage() {
  return (
    <FormCard title={sections.news.addLabel}>
      <SectionForm section={sections.news} />
    </FormCard>
  );
}
