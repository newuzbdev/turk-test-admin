import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type {
  SpeakingSection,
  SpeakingSubPart,
  SpeakingQuestion,
  SpeakingPoint,
} from "@/utils/types/types";
import axiosPrivate from "@/config/api";
import { speakingTestEndpoints } from "@/config/endpoint";

// Types for the speaking editor
interface SpeakingTestData {
  title: string;
  ieltsId: string;
  sections: SpeakingSection[];
}

interface CreateSpeakingTestData {
  title: string;
  ieltsId: string;
  sections: {
    order: number;
    type: string;
    title: string;
    description: string;
    content: string;
    images: string[];
    subParts: {
      label: string;
      description: string;
      images: string[];
      questions: {
        order: number;
        question: string;
      }[];
    }[];
    points: {
      order: number;
      type: string;
      example?:
        | {
            text: string;
            order: number;
          }
        | {
            text: string;
            order: number;
          }[];
    }[];
  }[];
}

// Get one speaking test
export const useGetOneSpeakingTest = (id: string) => {
  return useQuery({
    queryKey: ["speaking", "one", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await axiosPrivate.get(speakingTestEndpoints.one(id));
      return response.data;
    },
    enabled: !!id,
  });
};

// Create speaking test
export const useCreateSpeakingTest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSpeakingTestData) => {
      const response = await axiosPrivate.post(speakingTestEndpoints.all, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["speaking"] });
      toast.success("Speaking test muvaffaqiyatli yaratildi");
    },
    onError: (error: any) => {
      toast.error("Speaking test yaratishda xatolik yuz berdi");
      console.error("Create speaking test error:", error);
    },
  });
};

// Update speaking test
export const useUpdateSpeakingTest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: CreateSpeakingTestData;
    }) => {
      const response = await axiosPrivate.put(
        speakingTestEndpoints.one(id),
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["speaking"] });
      toast.success("Speaking test muvaffaqiyatli yangilandi");
    },
    onError: (error: any) => {
      toast.error("Speaking test yangilashda xatolik yuz berdi");
      console.error("Update speaking test error:", error);
    },
  });
};

// Speaking editor utilities
export const useSpeakingEditor = () => {
  // Section management
  const addSection = (
    testData: SpeakingTestData,
    setTestData: React.Dispatch<React.SetStateAction<SpeakingTestData>>,
    id?: string
  ) => {
    const newSection: SpeakingSection = {
      id: `temp-section-${Date.now()}`,
      title: `Section ${testData.sections.length + 1}`,
      description: "",
      content: "",
      order: testData.sections.length + 1,
      type: "PART1",
      speakingTestId: id || "",
      images: [],
      subParts: [],
      questions: [],
    };

    setTestData((prev) => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }));
  };

  const updateSection = (
    _testData: SpeakingTestData,
    setTestData: React.Dispatch<React.SetStateAction<SpeakingTestData>>,
    sectionIndex: number,
    updates: Partial<SpeakingSection>
  ) => {
    setTestData((prev) => ({
      ...prev,
      sections: prev.sections.map((section, index) =>
        index === sectionIndex ? { ...section, ...updates } : section
      ),
    }));
  };

  const deleteSection = (
    _testData: SpeakingTestData,
    setTestData: React.Dispatch<React.SetStateAction<SpeakingTestData>>,
    sectionIndex: number
  ) => {
    setTestData((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, index) => index !== sectionIndex),
    }));
  };

  // Sub-part management
  const addSubPart = (
    testData: SpeakingTestData,
    setTestData: React.Dispatch<React.SetStateAction<SpeakingTestData>>,
    sectionIndex: number
  ) => {
    // addSubPart ichida images bo'sh massiv bilan boshlash
    const newSubPart: SpeakingSubPart = {
      id: `temp-subpart-${Date.now()}`,
      label: `${testData.sections[sectionIndex].order}.${
        (testData.sections[sectionIndex].subParts?.length || 0) + 1
      }`,
      description: "",
      speakingSectionId: testData.sections[sectionIndex].id || "",
      order: (testData.sections[sectionIndex].subParts?.length || 0) + 1,
      images: [], // <-- qo'shildi
      questions: [],
    };

    updateSection(testData, setTestData, sectionIndex, {
      subParts: [
        ...(testData.sections[sectionIndex].subParts || []),
        newSubPart,
      ],
    });
  };

  const updateSubPart = (
    testData: SpeakingTestData,
    setTestData: React.Dispatch<React.SetStateAction<SpeakingTestData>>,
    sectionIndex: number,
    subPartIndex: number,
    updates: Partial<SpeakingSubPart>
  ) => {
    const updatedSubParts = [
      ...(testData.sections[sectionIndex].subParts || []),
    ];
    updatedSubParts[subPartIndex] = {
      ...updatedSubParts[subPartIndex],
      ...updates,
    };
    updateSection(testData, setTestData, sectionIndex, {
      subParts: updatedSubParts,
    });
  };

  const deleteSubPart = (
    testData: SpeakingTestData,
    setTestData: React.Dispatch<React.SetStateAction<SpeakingTestData>>,
    sectionIndex: number,
    subPartIndex: number
  ) => {
    const updatedSubParts =
      testData.sections[sectionIndex].subParts?.filter(
        (_, index) => index !== subPartIndex
      ) || [];
    updateSection(testData, setTestData, sectionIndex, {
      subParts: updatedSubParts,
    });
  };

  // Question management
  const addQuestion = (
    testData: SpeakingTestData,
    setTestData: React.Dispatch<React.SetStateAction<SpeakingTestData>>,
    sectionIndex: number,
    subPartIndex?: number
  ) => {
    const newQuestion: SpeakingQuestion = {
      id: `temp-question-${Date.now()}`,
      question: "",
      order: 1,
    };

    if (subPartIndex !== undefined) {
      // Add to sub-part
      const updatedSubParts = [
        ...(testData.sections[sectionIndex].subParts || []),
      ];
      const subPart = updatedSubParts[subPartIndex];
      newQuestion.order = (subPart.questions?.length || 0) + 1;
      newQuestion.speakingSubPartId = subPart.id;

      updatedSubParts[subPartIndex] = {
        ...subPart,
        questions: [...(subPart.questions || []), newQuestion],
      };
      updateSection(testData, setTestData, sectionIndex, {
        subParts: updatedSubParts,
      });
    } else {
      // Add to section
      newQuestion.order =
        (testData.sections[sectionIndex].questions?.length || 0) + 1;
      newQuestion.speakingSectionId = testData.sections[sectionIndex].id;

      updateSection(testData, setTestData, sectionIndex, {
        questions: [
          ...(testData.sections[sectionIndex].questions || []),
          newQuestion,
        ],
      });
    }
  };

  const updateQuestion = (
    testData: SpeakingTestData,
    setTestData: React.Dispatch<React.SetStateAction<SpeakingTestData>>,
    sectionIndex: number,
    subPartIndex: number,
    questionIndex: number,
    updates: Partial<SpeakingQuestion>
  ) => {
    const updatedSubParts = [
      ...(testData.sections[sectionIndex].subParts || []),
    ];
    const updatedQuestions = [
      ...(updatedSubParts[subPartIndex].questions || []),
    ];
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      ...updates,
    };
    updatedSubParts[subPartIndex] = {
      ...updatedSubParts[subPartIndex],
      questions: updatedQuestions,
    };
    updateSection(testData, setTestData, sectionIndex, {
      subParts: updatedSubParts,
    });
  };

  const deleteQuestion = (
    testData: SpeakingTestData,
    setTestData: React.Dispatch<React.SetStateAction<SpeakingTestData>>,
    sectionIndex: number,
    subPartIndex: number,
    questionIndex: number
  ) => {
    const updatedSubParts = [
      ...(testData.sections[sectionIndex].subParts || []),
    ];
    const updatedQuestions =
      updatedSubParts[subPartIndex].questions?.filter(
        (_, index) => index !== questionIndex
      ) || [];
    updatedSubParts[subPartIndex] = {
      ...updatedSubParts[subPartIndex],
      questions: updatedQuestions,
    };
    updateSection(testData, setTestData, sectionIndex, {
      subParts: updatedSubParts,
    });
  };

  // Point management
  const addPoint = (
    testData: SpeakingTestData,
    setTestData: React.Dispatch<React.SetStateAction<SpeakingTestData>>,
    sectionIndex: number,
    type: "ADVANTAGE" | "DISADVANTAGE"
  ) => {
    const newPoint: SpeakingPoint = {
      id: `temp-point-${Date.now()}`,
      order: (testData.sections[sectionIndex].points?.length || 0) + 1,
      type,
      speakingSectionId: testData.sections[sectionIndex].id || "",
    };

    updateSection(testData, setTestData, sectionIndex, {
      points: [...(testData.sections[sectionIndex].points || []), newPoint],
    });
  };

  const updatePoint = (
    testData: SpeakingTestData,
    setTestData: React.Dispatch<React.SetStateAction<SpeakingTestData>>,
    sectionIndex: number,
    pointIndex: number,
    updates: Partial<SpeakingPoint>
  ) => {
    const updatedPoints = [...(testData.sections[sectionIndex].points || [])];
    updatedPoints[pointIndex] = {
      ...updatedPoints[pointIndex],
      ...updates,
    };
    updateSection(testData, setTestData, sectionIndex, {
      points: updatedPoints,
    });
  };

  const deletePoint = (
    testData: SpeakingTestData,
    setTestData: React.Dispatch<React.SetStateAction<SpeakingTestData>>,
    sectionIndex: number,
    pointIndex: number
  ) => {
    const updatedPoints =
      testData.sections[sectionIndex].points?.filter(
        (_, index) => index !== pointIndex
      ) || [];
    updateSection(testData, setTestData, sectionIndex, {
      points: updatedPoints,
    });
  };

  const addPointExample = (
    testData: SpeakingTestData,
    setTestData: React.Dispatch<React.SetStateAction<SpeakingTestData>>,
    sectionIndex: number,
    pointIndex: number
  ) => {
    const updatedPoints = [...(testData.sections[sectionIndex].points || [])];
    const point = updatedPoints[pointIndex];
    const currentExamples = Array.isArray(point.examples)
      ? point.examples
      : point.examples
      ? [point.examples]
      : [];

    const newExample = {
      text: "",
      order: currentExamples.length + 1,
    };

    updatedPoints[pointIndex] = {
      ...point,
      examples: [...currentExamples, newExample],
    };
    updateSection(testData, setTestData, sectionIndex, {
      points: updatedPoints,
    });
  };

  const updatePointExample = (
    testData: SpeakingTestData,
    setTestData: React.Dispatch<React.SetStateAction<SpeakingTestData>>,
    sectionIndex: number,
    pointIndex: number,
    exampleIndex: number,
    updates: Partial<{ text: string; order: number }>
  ) => {
    const updatedPoints = [...(testData.sections[sectionIndex].points || [])];
    const point = updatedPoints[pointIndex];
    const currentExamples = Array.isArray(point.examples)
      ? point.examples
      : point.examples
      ? [point.examples]
      : [];
    const updatedExamples = [...currentExamples];
    updatedExamples[exampleIndex] = {
      ...updatedExamples[exampleIndex],
      ...updates,
    };

    updatedPoints[pointIndex] = {
      ...point,
      examples: updatedExamples,
    };
    updateSection(testData, setTestData, sectionIndex, {
      points: updatedPoints,
    });
  };

  const deletePointExample = (
    testData: SpeakingTestData,
    setTestData: React.Dispatch<React.SetStateAction<SpeakingTestData>>,
    sectionIndex: number,
    pointIndex: number,
    exampleIndex: number
  ) => {
    const updatedPoints = [...(testData.sections[sectionIndex].points || [])];
    const point = updatedPoints[pointIndex];
    const currentExamples = Array.isArray(point.examples)
      ? point.examples
      : point.examples
      ? [point.examples]
      : [];
    const updatedExamples = currentExamples.filter(
      (_, index) => index !== exampleIndex
    );

    updatedPoints[pointIndex] = {
      ...point,
      examples: updatedExamples.length === 0 ? undefined : updatedExamples,
    };
    updateSection(testData, setTestData, sectionIndex, {
      points: updatedPoints,
    });
  };
  // helper functions
  const constructFullImageUrl = (path: string): string => {
    if (!path) return "";
    
    // If the path already contains http/https, return it as is
    if (path.startsWith('http')) {
      return path;
    }
    
    // Construct full URL using base API URL
    const baseURL = import.meta.env.VITE_API_URL;
    if (!baseURL) {
      console.warn("VITE_API_URL is not defined");
      return path;
    }
    
    // Remove leading slash from path if it exists to avoid double slashes
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    // Remove trailing slash from baseURL if it exists
    const cleanBaseURL = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
    
    return `${cleanBaseURL}/${cleanPath}`;
  };

  const getUploadedPath = (res: any) => {
    const path = res?.data?.path || res?.data?.url || res?.path || res?.url || "";
    const fullUrl = constructFullImageUrl(path);
    console.log("Image upload - original path:", path, "full URL:", fullUrl);
    return fullUrl;
  };

  // Process sections to ensure all images have full URLs
  const processSectionsImages = (sections: SpeakingSection[]): SpeakingSection[] => {
    return sections.map(section => ({
      ...section,
      images: section.images?.map(constructFullImageUrl) || [],
      subParts: section.subParts?.map(subPart => ({
        ...subPart,
        images: subPart.images?.map(constructFullImageUrl) || [],
      })) || [],
    }));
  };

  const handleSectionImageUpload = async (
    testData: SpeakingTestData,
    setTestData: React.Dispatch<React.SetStateAction<SpeakingTestData>>,
    sectionIndex: number,
    file: File,
    uploadFile: (file: File) => Promise<any>
  ) => {
    try {
      const response = await uploadFile(file);
      const imagePath = getUploadedPath(response);

      if (!imagePath) {
        console.error("Image path not found in response:", response);
        return;
      }

      const currentImages = testData.sections[sectionIndex].images ?? [];
      updateSection(testData, setTestData, sectionIndex, {
        images: [...currentImages, imagePath],
      });
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const handleSubPartImageUpload = async (
    testData: SpeakingTestData,
    setTestData: React.Dispatch<React.SetStateAction<SpeakingTestData>>,
    sectionIndex: number,
    subPartIndex: number,
    file: File,
    uploadFile: (file: File) => Promise<any>
  ) => {
    try {
      const response = await uploadFile(file);
      const imagePath = getUploadedPath(response);

      const updatedSubParts = [
        ...(testData.sections[sectionIndex].subParts ?? []),
      ];
      const subPart = updatedSubParts[subPartIndex];
      const currentImages = subPart.images ?? [];

      updatedSubParts[subPartIndex] = {
        ...subPart,
        images: [...currentImages, imagePath],
      };

      updateSection(testData, setTestData, sectionIndex, {
        subParts: updatedSubParts,
      });
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const removeSectionImage = (
    testData: SpeakingTestData,
    setTestData: React.Dispatch<React.SetStateAction<SpeakingTestData>>,
    sectionIndex: number,
    imageIndex: number
  ) => {
    const currentImages = testData.sections[sectionIndex].images || [];
    const updatedImages = currentImages.filter(
      (_, index) => index !== imageIndex
    );
    updateSection(testData, setTestData, sectionIndex, {
      images: updatedImages,
    });
  };

  const removeSubPartImage = (
    testData: SpeakingTestData,
    setTestData: React.Dispatch<React.SetStateAction<SpeakingTestData>>,
    sectionIndex: number,
    subPartIndex: number,
    imageIndex: number
  ) => {
    const updatedSubParts = [
      ...(testData.sections[sectionIndex].subParts || []),
    ];
    const subPart = updatedSubParts[subPartIndex];
    const currentImages = subPart.images || [];
    const updatedImages = currentImages.filter(
      (_, index) => index !== imageIndex
    );
    updatedSubParts[subPartIndex] = {
      ...subPart,
      images: updatedImages,
    };
    updateSection(testData, setTestData, sectionIndex, {
      subParts: updatedSubParts,
    });
  };

  return {
    // Queries
    useGetOneSpeakingTest,
    useCreateSpeakingTest,
    useUpdateSpeakingTest,

    // Section management
    addSection,
    updateSection,
    deleteSection,

    // Sub-part management
    addSubPart,
    updateSubPart,
    deleteSubPart,

    // Question management
    addQuestion,
    updateQuestion,
    deleteQuestion,

    // Point management
    addPoint,
    updatePoint,
    deletePoint,

    addPointExample,
    updatePointExample,
    deletePointExample,

    // Image management
    handleSectionImageUpload,
    handleSubPartImageUpload,
    removeSectionImage,
    removeSubPartImage,
    
    // Helper functions
    processSectionsImages,
  };
};
