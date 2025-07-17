import { Listening, Reading, Speaking, Writing } from "@/pages";
import { IELTS } from "./lazy-pages";
import ListeningEditor from "@/pages/listening/listening-editor";
import ReadingEditor from "@/pages/reading/reading-editor";
import SpeakingEditor from "@/pages/speaking/speaking-editor";
import WritingEditor from "@/pages/writing/writing-editor";
import {
  BookAudioIcon,
  BookOpenIcon,
  Headphones,
  Speaker,
  PenTool,
} from "lucide-react";

export interface RouterConfig {
  title: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  page: React.ReactNode;
  children?: RouterConfig[];
  inMenu: boolean;
  isChild?: boolean;
  protected?: boolean;
}

export const routerConfig: RouterConfig[] = [
  {
    title: "Listening",
    label: "Listening",
    icon: <Headphones />,
    path: "listening",
    page: <Listening />,
    inMenu: true,
  },
  {
    title: "Listening Editor",
    label: "Listening Editor",
    icon: <Headphones />,
    path: "listening/:id/edit",
    page: <ListeningEditor />,
    inMenu: false,
  },
  {
    title: "Reading",
    label: "Reading",
    icon: <BookOpenIcon />,
    path: "reading",
    page: <Reading />,
    inMenu: true,
  },
  {
    title: "Reading Editor",
    label: "Reading Editor",
    icon: <BookOpenIcon />,
    path: "reading/:id/edit",
    page: <ReadingEditor />,
    inMenu: false,
  },
  // {
  //   title: "Reading",
  //   label: "Reading",
  //   icon: <Book />,
  //   path: "reading",
  //   page: <Reading />,
  //   inMenu: true,
  // },
  {
    title: "Speaking",
    label: "Speaking",
    icon: <Speaker />,
    path: "speaking",
    page: <Speaking />,
    inMenu: true,
  },
  {
    title: "Speaking Editor",
    label: "Speaking Editor",
    icon: <Speaker />,
    path: "speaking/:id/edit",
    page: <SpeakingEditor />,
    inMenu: false,
  },
  {
    title: "Writing",
    label: "Writing",
    icon: <PenTool />,
    path: "writing",
    page: <Writing />,
    inMenu: true,
  },
  {
    title: "Writing Editor",
    label: "Writing Editor",
    icon: <PenTool />,
    path: "writing/:id/edit",
    page: <WritingEditor />,
    inMenu: false,
  },

  {
    title: "TEST",
    label: "TEST",
    icon: <BookAudioIcon />,
    path: "test",
    page: <IELTS />,
    inMenu: true,
  },

  // {
  //     title: 'Manage Ads',
  //     label: 'Manage Ads',
  //     icon: <Plus />,
  //     path: 'manage-ads',
  //     page: <Outlet />,
  //     inMenu: true,
  //     children: [
  //         {
  //             title: 'Ads',
  //             label: 'Ads',
  //             icon: undefined,
  //             path: 'ads',
  //             page: <Ads />,
  //             inMenu: true,
  //         },
  //         {
  //             title: 'Targets',
  //             label: 'Targets',
  //             icon: undefined,
  //             path: 'targets',
  //             page: <Targets />,
  //             inMenu: true,
  //         },
  //     ],
  // },
];
