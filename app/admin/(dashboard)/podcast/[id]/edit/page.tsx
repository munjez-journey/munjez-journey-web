import SectionEditForm from "../../../../_components/SectionEditForm";
import { sections } from "../../../../_lib/sections";

export default async function EditSectionItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SectionEditForm section={sections.podcast} id={id} />;
}
