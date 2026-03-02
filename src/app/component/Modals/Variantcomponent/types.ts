import { VariantSectionType } from "@/src/types/product.type";
import { Variantcontainertype } from "../types";
import { accessFromSectionType } from "../VariantModal";

export interface VariantSectionEditorProps {
  editSectionId?: number;
  newadd: Variantcontainertype;
  sectionName: string;
  accessFromSection?: accessFromSectionType;
  setSectionName: React.Dispatch<React.SetStateAction<string>>;
  setNew: React.Dispatch<React.SetStateAction<Variantcontainertype>>;
  setVariantSectionId: React.Dispatch<React.SetStateAction<number | undefined>>;
  seteditSectonId: React.Dispatch<React.SetStateAction<number | undefined>>;
  setSuccessMessage: React.Dispatch<React.SetStateAction<string>>;
  setaccessFromSection: React.Dispatch<
    React.SetStateAction<accessFromSectionType | undefined>
  >;
}

export interface SectionItemProps {
  section: VariantSectionType;
  idx: number;
  product: any;
  isSelected: boolean;
  onToggleSelection: (id: number) => void;
  onEdit: (id: number) => void;
  onAddVariant: (id: number) => void;
  onDelete: (id: number) => void;
  isDeleting: boolean;
}

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  resultsCount?: number;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}
