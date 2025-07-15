import { Listening } from "@/pages";
import { IELTS } from "./lazy-pages";
import {
  BookAudioIcon,
  Headphones,
  // Headphones,
  // MessageCircleIcon,
  // Speaker,
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
  // {
  //   title: "Reading",
  //   label: "Reading",
  //   icon: <Book />,
  //   path: "reading",
  //   page: <Reading />,
  //   inMenu: true,
  // },
  // {
  //   title: "Speaking",
  //   label: "Speaking",
  //   icon: <Speaker />,
  //   path: "speaking",
  //   page: <Speaking />,
  //   inMenu: true,
  // },
  // {
  //   title: "Writing",
  //   label: "Writing",
  //   icon: <MessageCircleIcon />,
  //   path: "writing",
  //   page: <Writing />,
  //   inMenu: true,
  // },

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
