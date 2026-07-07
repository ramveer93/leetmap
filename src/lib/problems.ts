export type Difficulty = "Easy" | "Medium" | "Hard";

export type Problem = {
  id: number;
  title: string;
  slug: string;
  difficulty: Difficulty;
  tags: string[];
  companies: string[];
};

// Sample dataset — mirrors what a local sync of data-sources/ would produce.
export const PROBLEMS: Problem[] = [
  {
    id: 1,
    title: "Two Sum",
    slug: "two-sum",
    difficulty: "Easy",
    tags: ["Array", "Hash Table"],
    companies: ["Google", "Amazon", "Meta", "Apple", "Microsoft", "Adobe"],
  },
  {
    id: 14,
    title: "Longest Common Prefix",
    slug: "longest-common-prefix",
    difficulty: "Easy",
    tags: ["String", "Trie"],
    companies: ["Adobe", "Meta", "Yelp"],
  },
  {
    id: 20,
    title: "Valid Parentheses",
    slug: "valid-parentheses",
    difficulty: "Easy",
    tags: ["String", "Stack"],
    companies: ["Amazon", "Google", "Meta", "Bloomberg"],
  },
  {
    id: 21,
    title: "Merge Two Sorted Lists",
    slug: "merge-two-sorted-lists",
    difficulty: "Easy",
    tags: ["Linked List", "Recursion"],
    companies: ["Amazon", "Apple", "Microsoft"],
  },
  {
    id: 23,
    title: "Merge k Sorted Lists",
    slug: "merge-k-sorted-lists",
    difficulty: "Hard",
    tags: ["Heap", "Divide & Conquer", "Linked List"],
    companies: ["Google", "Amazon", "Meta", "Uber"],
  },
  {
    id: 42,
    title: "Trapping Rain Water",
    slug: "trapping-rain-water",
    difficulty: "Hard",
    tags: ["Array", "Two Pointers", "Stack"],
    companies: ["Google", "Amazon", "Meta", "Bloomberg", "Goldman Sachs"],
  },
  {
    id: 53,
    title: "Maximum Subarray",
    slug: "maximum-subarray",
    difficulty: "Medium",
    tags: ["Array", "Dynamic Programming"],
    companies: ["Amazon", "Microsoft", "LinkedIn"],
  },
  {
    id: 76,
    title: "Minimum Window Substring",
    slug: "minimum-window-substring",
    difficulty: "Hard",
    tags: ["String", "Sliding Window", "Hash Table"],
    companies: ["Meta", "Uber", "LinkedIn"],
  },
  {
    id: 88,
    title: "Merge Sorted Array",
    slug: "merge-sorted-array",
    difficulty: "Easy",
    tags: ["Array", "Two Pointers", "Sorting"],
    companies: ["Meta", "Bloomberg", "Adobe"],
  },
  {
    id: 121,
    title: "Best Time to Buy and Sell Stock",
    slug: "best-time-to-buy-and-sell-stock",
    difficulty: "Easy",
    tags: ["Array", "Dynamic Programming"],
    companies: ["Amazon", "Meta", "Microsoft", "Bloomberg", "Uber"],
  },
  {
    id: 125,
    title: "Valid Palindrome",
    slug: "valid-palindrome",
    difficulty: "Easy",
    tags: ["Two Pointers", "String"],
    companies: ["Meta", "Microsoft"],
  },
  {
    id: 146,
    title: "LRU Cache",
    slug: "lru-cache",
    difficulty: "Medium",
    tags: ["Hash Map", "Linked List", "Design"],
    companies: ["Amazon", "Google", "Meta", "Microsoft", "Bloomberg"],
  },
  {
    id: 200,
    title: "Number of Islands",
    slug: "number-of-islands",
    difficulty: "Medium",
    tags: ["DFS", "BFS", "Union Find"],
    companies: ["Amazon", "Google", "Meta"],
  },
  {
    id: 206,
    title: "Reverse Linked List",
    slug: "reverse-linked-list",
    difficulty: "Easy",
    tags: ["Linked List", "Recursion"],
    companies: ["Meta", "Microsoft", "Amazon"],
  },
  {
    id: 252,
    title: "Meeting Rooms",
    slug: "meeting-rooms",
    difficulty: "Easy",
    tags: ["Array", "Sorting"],
    companies: ["Meta", "Bloomberg"],
  },
  {
    id: 295,
    title: "Find Median from Data Stream",
    slug: "find-median-from-data-stream",
    difficulty: "Hard",
    tags: ["Heap", "Design"],
    companies: ["Google", "Amazon", "Meta"],
  },
  {
    id: 300,
    title: "Longest Increasing Subsequence",
    slug: "longest-increasing-subsequence",
    difficulty: "Medium",
    tags: ["Array", "Dynamic Programming", "Binary Search"],
    companies: ["Microsoft", "Meta", "Google"],
  },
  {
    id: 412,
    title: "Fizz Buzz",
    slug: "fizz-buzz",
    difficulty: "Easy",
    tags: ["Math", "String", "Simulation"],
    companies: ["Apple", "Bloomberg"],
  },
];

export const ALL_COMPANIES = Array.from(
  new Set(PROBLEMS.flatMap((p) => p.companies)),
).sort();

export const ALL_TAGS = Array.from(new Set(PROBLEMS.flatMap((p) => p.tags))).sort();
