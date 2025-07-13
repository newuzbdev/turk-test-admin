import React from "react";
import BasePartForm from "../../../shared/ui/test-creation/base-part-form";
import ReadingSectionForm from "./section-form";
import type { TestPartDto } from "../../../config/querys/test-query";

interface ReadingPartFormProps {
  part: TestPartDto;
  onChange: (part: TestPartDto) => void;
  onRemove: () => void;
}

export default function ReadingPartForm(props: ReadingPartFormProps) {
  return (
    <BasePartForm
      {...props}
      testType="READING"
      sectionComponent={ReadingSectionForm}
    />
  );
}
