import { Card } from "@/components/ui/card";

interface RiskMatrixProps {
  likelihood?: string;
  consequence?: string;
  onSelect?: (likelihood: string, consequence: string) => void;
  readonly?: boolean;
}

const likelihoodLevels = [
  { value: "rare", label: "Rare", description: "May occur in exceptional circumstances" },
  { value: "unlikely", label: "Unlikely", description: "Could occur but not expected" },
  { value: "possible", label: "Possible", description: "Might occur occasionally" },
  { value: "likely", label: "Likely", description: "Will probably occur" },
  { value: "almost_certain", label: "Almost Certain", description: "Expected to occur" },
];

const consequenceLevels = [
  { value: "insignificant", label: "Insignificant", description: "No injuries, minimal impact" },
  { value: "minor", label: "Minor", description: "First aid treatment, minor impact" },
  { value: "moderate", label: "Moderate", description: "Medical treatment required" },
  { value: "major", label: "Major", description: "Extensive injuries, major impact" },
  { value: "catastrophic", label: "Catastrophic", description: "Death or permanent disability" },
];

const getRiskRating = (likelihoodIdx: number, consequenceIdx: number): { level: string; color: string } => {
  const score = (likelihoodIdx + 1) * (consequenceIdx + 1);
  
  if (score <= 4) return { level: "Low", color: "bg-green-500" };
  if (score <= 8) return { level: "Medium", color: "bg-yellow-500" };
  if (score <= 15) return { level: "High", color: "bg-orange-500" };
  return { level: "Extreme", color: "bg-red-500" };
};

export function RiskMatrix({ likelihood, consequence, onSelect, readonly = false }: RiskMatrixProps) {
  const selectedLikelihoodIdx = likelihoodLevels.findIndex(l => l.value === likelihood);
  const selectedConsequenceIdx = consequenceLevels.findIndex(c => c.value === consequence);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Risk Assessment Matrix</h3>
        <div className="grid grid-cols-6 gap-1 text-xs">
          {/* Header row */}
          <div className="bg-muted p-2 font-semibold text-center"></div>
          {consequenceLevels.map((cons) => (
            <div key={cons.value} className="bg-muted p-2 font-semibold text-center">
              {cons.label}
            </div>
          ))}

          {/* Matrix rows */}
          {likelihoodLevels.slice().reverse().map((like, likeIdx) => {
            const reverseLikeIdx = likelihoodLevels.length - 1 - likeIdx;
            return (
              <div key={like.value} className="contents">
                <div className="bg-muted p-2 font-semibold text-center flex items-center justify-center">
                  {like.label}
                </div>
                {consequenceLevels.map((cons, consIdx) => {
                  const risk = getRiskRating(reverseLikeIdx, consIdx);
                  const isSelected = 
                    selectedLikelihoodIdx === reverseLikeIdx && 
                    selectedConsequenceIdx === consIdx;
                  
                  return (
                    <button
                      key={`${like.value}-${cons.value}`}
                      type="button"
                      onClick={() => !readonly && onSelect?.(like.value, cons.value)}
                      disabled={readonly}
                      className={`p-4 ${risk.color} text-white font-semibold transition-all ${
                        isSelected ? "ring-4 ring-primary scale-105" : ""
                      } ${!readonly ? "hover:scale-105 cursor-pointer" : ""}`}
                    >
                      {risk.level}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <Card className="p-4">
        <h4 className="font-semibold mb-3">Risk Rating Legend</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium mb-2">Likelihood</p>
            <ul className="space-y-1 text-muted-foreground">
              {likelihoodLevels.map((level) => (
                <li key={level.value}>
                  <span className="font-medium">{level.label}:</span> {level.description}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-medium mb-2">Consequence</p>
            <ul className="space-y-1 text-muted-foreground">
              {consequenceLevels.map((level) => (
                <li key={level.value}>
                  <span className="font-medium">{level.label}:</span> {level.description}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
