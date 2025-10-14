import { Archive, Listening, Reading, Speaking, Writing } from "@/pages";
import {
  Archive as ArchiveIcon,
  BookAudioIcon,
  BookOpenIcon,
  Headphones,
  PenTool,
  Speaker,
  ImageIcon,
  Package,
} from "lucide-react";

import { IELTS, Banner, Product, TestCoinPrice } from "./lazy-pages";
import ListeningEditor from "@/pages/listening/listening-editor";
import ReadingEditor from "@/pages/reading/reading-editor";
import SpeakingEditor from "@/pages/speaking/speaking-editor";
import WritingEditor from "@/pages/writing/writing-editor";

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
    path: "listening/:ieltsId/edit",
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
    path: "reading/:ieltsId/edit",
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
  {
    title: "Banner",
    label: "Banner",
    icon: <ImageIcon />,
    path: "banner",
    page: <Banner />,
    inMenu: true,
  },
  {
    title: "Product",
    label: "Mahsulotlar",
    icon: <Package />,
    path: "product",
    page: <Product />,
    inMenu: true,
  },
  {
    title: "TestCoinPrice",
    label: "Test Coin Price",
    icon: <Package />,
    path: "test-coin-price",
    page: <TestCoinPrice />,
    inMenu: true,
  },
  {
    title: "Archive",
    label: "Arxiv",
    icon: <ArchiveIcon />,
    path: "archive",
    page: <Archive />,
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
