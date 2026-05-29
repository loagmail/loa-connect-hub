import "jspdf"

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: import("jspdf-autotable").UserOptions) => void
    lastAutoTable: {
      finalY: number
    }
  }
}
