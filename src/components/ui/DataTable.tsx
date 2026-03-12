import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

// Thin wrapper around the base table components so that
// dashboard pages can import a single DataTable module and
// get consistent enterprise styling.
//
// The low-level `table` components already implement:
// - header background and typography
// - row hover states
// - compact numeric cell alignment via utility classes.

export {
  Table as DataTable,
  TableBody as DataTableBody,
  TableCaption as DataTableCaption,
  TableCell as DataTableCell,
  TableFooter as DataTableFooter,
  TableHead as DataTableHead,
  TableHeader as DataTableHeader,
  TableRow as DataTableRow,
};

