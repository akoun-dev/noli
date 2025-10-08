import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Check, Minus } from "lucide-react";

export interface SimpleOffer {
  id: number | string;
  insurer: string;
  logo?: string;
  monthlyPrice: number;
  franchise: string;
  coverageType: string;
  features: string[]; // guarantees list
}

interface OfferCompareModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  offers: SimpleOffer[];
}

const OfferCompareModal = ({ open, onOpenChange, offers }: OfferCompareModalProps) => {
  const guaranteeSet = new Set<string>();
  offers.forEach(o => o.features.forEach(g => guaranteeSet.add(g)));
  const guarantees = Array.from(guaranteeSet).sort();

  const isDifferent = (g: string) => {
    const values = offers.map(o => o.features.includes(g));
    return values.some(v => v !== values[0]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Comparer les garanties</DialogTitle>
        </DialogHeader>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Critères</TableHead>
                {offers.map((o) => (
                  <TableHead key={o.id} className="text-center">
                    <div className="flex flex-col items-center">
                      <div className="text-2xl leading-none">{o.logo}</div>
                      <div className="font-semibold text-foreground">{o.insurer}</div>
                      <Badge variant="outline" className="mt-1">{o.coverageType}</Badge>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Prix mensuel</TableCell>
                {offers.map(o => (
                  <TableCell key={o.id} className="text-center font-semibold text-primary">
                    {o.monthlyPrice.toLocaleString()} FCFA
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Franchise</TableCell>
                {offers.map(o => (
                  <TableCell key={o.id} className="text-center">{o.franchise}</TableCell>
                ))}
              </TableRow>

              {guarantees.map((g) => (
                <TableRow key={g} className={isDifferent(g) ? "bg-accent/5" : undefined}>
                  <TableCell className="font-medium">{g}</TableCell>
                  {offers.map((o) => (
                    <TableCell key={`${o.id}-${g}`} className="text-center">
                      {o.features.includes(g) ? (
                        <Check className="inline-block w-5 h-5 text-accent" />
                      ) : (
                        <Minus className="inline-block w-5 h-5 text-muted-foreground" />
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OfferCompareModal;

