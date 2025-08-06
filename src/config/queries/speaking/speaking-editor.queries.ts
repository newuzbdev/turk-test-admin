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
      questions: {
        order: number;
        question: string;
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
    mutationFn: async ({ id, data }: { id: string; data: CreateSpeakingTestData }) => {
      const response = await axiosPrivate.put(speakingTestEndpoints.one(id), data);
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
    const newSubPart: SpeakingSubPart = {
      id: `temp-subpart-${Date.now()}`,
      label: `${testData.sections[sectionIndex].order}.${
        (testData.sections[sectionIndex].subParts?.length || 0) + 1
      }`,
      description: "",
      speakingSectionId: testData.sections[sectionIndex].id || "",
      order: (testData.sections[sectionIndex].subParts?.length || 0) + 1,
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
    updateSection(testData, setTestData, sectionIndex, { subParts: updatedSubParts });
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
    updateSection(testData, setTestData, sectionIndex, { subParts: updatedSubParts });
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
      updateSection(testData, setTestData, sectionIndex, { subParts: updatedSubParts });
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
    const updatedQuestions = [...(updatedSubParts[subPartIndex].questions || [])];
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      ...updates,
    };
    updatedSubParts[subPartIndex] = {
      ...updatedSubParts[subPartIndex],
      questions: updatedQuestions,
    };
    updateSection(testData, setTestData, sectionIndex, { subParts: updatedSubParts });
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
    const updatedQuestions = updatedSubParts[subPartIndex].questions?.filter(
      (_, index) => index !== questionIndex
    ) || [];
    updatedSubParts[subPartIndex] = {
      ...updatedSubParts[subPartIndex],
      questions: updatedQuestions,
    };
    updateSection(testData, setTestData, sectionIndex, { subParts: updatedSubParts });
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
      questions: [],
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
    updateSection(testData, setTestData, sectionIndex, { points: updatedPoints });
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
    updateSection(testData, setTestData, sectionIndex, { points: updatedPoints });
  };

  const addPointQuestion = (
    testData: SpeakingTestData,
    setTestData: React.Dispatch<React.SetStateAction<SpeakingTestData>>,
    sectionIndex: number,
    pointIndex: number
  ) => {
    const newQuestion: SpeakingQuestion = {
      id: `temp-question-${Date.now()}`,
      question: "",
      order: 1,
    };

    const updatedPoints = [...(testData.sections[sectionIndex].points || [])];
    const point = updatedPoints[pointIndex];
    newQuestion.order = (point.questions?.length || 0) + 1;
    newQuestion.speakingSectionId = testData.sections[sectionIndex].id;

    updatedPoints[pointIndex] = {
      ...point,
      questions: [...(point.questions || []), newQuestion],
    };
    updateSection(testData, setTestData, sectionIndex, { points: updatedPoints });
  };

  const updatePointQuestion = (
    testData: SpeakingTestData,
    setTestData: React.Dispatch<React.SetStateAction<SpeakingTestData>>,
    sectionIndex: number,
    pointIndex: number,
    questionIndex: number,
    updates: Partial<SpeakingQuestion>
  ) => {
    const updatedPoints = [...(testData.sections[sectionIndex].points || [])];
    const updatedQuestions = [...(updatedPoints[pointIndex].questions || [])];
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      ...updates,
    };
    updatedPoints[pointIndex] = {
      ...updatedPoints[pointIndex],
      questions: updatedQuestions,
    };
    updateSection(testData, setTestData, sectionIndex, { points: updatedPoints });
  };

  const deletePointQuestion = (
    testData: SpeakingTestData,
    setTestData: React.Dispatch<React.SetStateAction<SpeakingTestData>>,
    sectionIndex: number,
    pointIndex: number,
    questionIndex: number
  ) => {
    const updatedPoints = [...(testData.sections[sectionIndex].points || [])];
    const updatedQuestions = updatedPoints[pointIndex].questions?.filter(
      (_, index) => index !== questionIndex
    ) || [];
    updatedPoints[pointIndex] = {
      ...updatedPoints[pointIndex],
      questions: updatedQuestions,
    };
    updateSection(testData, setTestData, sectionIndex, { points: updatedPoints });
  };

  // Image management
  const handleSectionImageUpload = async (
    testData: SpeakingTestData,
    setTestData: React.Dispatch<React.SetStateAction<SpeakingTestData>>,
    sectionIndex: number,
    file: File,
    uploadFile: (file: File) => Promise<any>
  ) => {
    try {
      const response = await uploadFile(file);
      const imageUrl = response.data.url;
      const currentImages = testData.sections[sectionIndex].images || [];
      updateSection(testData, setTestData, sectionIndex, {
        images: [...currentImages, imageUrl],
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
      const imageUrl = response.data.url;
      const updatedSubParts = [
        ...(testData.sections[sectionIndex].subParts || []),
      ];
      const subPart = updatedSubParts[subPartIndex];
      const currentImages = subPart.images || [];
      updatedSubParts[subPartIndex] = {
        ...subPart,
        images: [...currentImages, imageUrl],
      };
      updateSection(testData, setTestData, sectionIndex, { subParts: updatedSubParts });
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
    updateSection(testData, setTestData, sectionIndex, { images: updatedImages });
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
    updateSection(testData, setTestData, sectionIndex, { subParts: updatedSubParts });
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
    addPointQuestion,
    updatePointQuestion,
    deletePointQuestion,
    
    // Image management
    handleSectionImageUpload,
    handleSubPartImageUpload,
    removeSectionImage,
    removeSubPartImage,
  };
}; 