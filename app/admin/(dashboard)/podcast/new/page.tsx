import FormCard from "../../../_components/FormCard";
import SectionForm from "../../../_components/SectionForm";
import { sections } from "../../../_lib/sections";

export default function NewSectionItemPage() {
  return (
    <FormCard title={sections.podcast.addLabel}>
      <SectionForm section={sections.podcast} />
    </FormCard>
  );
}
