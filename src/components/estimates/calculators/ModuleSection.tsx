import { ComponentQuestion, EstimateModule, CostLineItem } from "@/lib/estimate-components/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AccordionDoneBadge } from "./shared/AccordionDoneBadge";
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ModuleSectionProps {
  module: EstimateModule;
  answers: Record<string, any>;
  onAnswerChange: (questionId: string, value: any) => void;
  isOpen: boolean;
  onToggle: () => void;
  subtotal: number;
  lineItems: CostLineItem[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function QuestionInput({
  question,
  value,
  onChange,
  allAnswers,
}: {
  question: ComponentQuestion;
  value: any;
  onChange: (value: any) => void;
  allAnswers: Record<string, any>;
}) {
  // Check conditional display
  if (question.showIf && !question.showIf(allAnswers)) {
    return null;
  }

  const inputId = `question-${question.id}`;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor={inputId} className="text-sm font-medium">
          {question.label}
          {question.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {question.helpText && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>{question.helpText}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {question.type === 'boolean' && (
        <div className="flex items-center gap-3">
          <Switch
            id={inputId}
            checked={Boolean(value)}
            onCheckedChange={onChange}
          />
          <span className="text-sm text-muted-foreground">
            {value ? 'Yes' : 'No'}
          </span>
        </div>
      )}

      {question.type === 'number' && (
        <div className="relative">
          <Input
            id={inputId}
            type="number"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
            min={question.min}
            max={question.max}
            step={question.step ?? 1}
            placeholder={question.placeholder}
            className="pr-12"
          />
          {question.unit && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {question.unit}
            </span>
          )}
        </div>
      )}

      {question.type === 'currency' && (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            $
          </span>
          <Input
            id={inputId}
            type="number"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
            min={question.min}
            max={question.max}
            step={question.step ?? 0.01}
            placeholder={question.placeholder}
            className="pl-7"
          />
        </div>
      )}

      {question.type === 'text' && (
        <Input
          id={inputId}
          type="text"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder}
        />
      )}

      {question.type === 'select' && question.options && (
        <Select
          value={value ?? ''}
          onValueChange={onChange}
        >
          <SelectTrigger>
            <SelectValue placeholder={question.placeholder ?? 'Select...'} />
          </SelectTrigger>
          <SelectContent>
            {question.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

export function ModuleSection({
  module,
  answers,
  onAnswerChange,
  isOpen,
  onToggle,
  subtotal,
  lineItems,
}: ModuleSectionProps) {
  // Get visible questions
  const visibleQuestions = module.questions.filter(
    (q) => !q.showIf || q.showIf(answers)
  );

  // Check if section is complete:
  // 1. Must have at least one visible question
  // 2. All required visible questions must be answered
  // 3. User must have actually entered something (not just defaults with no interaction)
  const hasRequiredQuestions = visibleQuestions.some((q) => q.required);
  const allRequiredAnswered = visibleQuestions.every((q) => {
    if (!q.required) return true;
    const val = answers[q.id];
    return val !== undefined && val !== '' && val !== null;
  });
  
  // Only mark as complete if there are required questions AND they're all answered
  // AND the user has actually provided meaningful answers (subtotal > 0 indicates real input)
  const isComplete = hasRequiredQuestions && allRequiredAnswered && subtotal > 0;


  return (
    <Accordion
      type="single"
      collapsible
      value={isOpen ? module.id : ''}
      onValueChange={(val) => {
        if (val === module.id) {
          onToggle();
        } else if (val === '') {
          onToggle();
        }
      }}
    >
      <AccordionItem value={module.id} className="border rounded-lg px-4">
        <AccordionTrigger className="hover:no-underline py-4">
          <div className="flex items-center gap-3 flex-1">
            <span className="font-medium">{module.name}</span>
            {isComplete && <AccordionDoneBadge />}
            {subtotal > 0 && (
              <span className="ml-auto mr-4 text-sm font-medium text-primary">
                {formatCurrency(subtotal)}
              </span>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-6">
          <div className="space-y-6">
            {/* Questions */}
            <div className="grid gap-4">
              {visibleQuestions.map((question) => (
                <QuestionInput
                  key={question.id}
                  question={question}
                  value={answers[question.id]}
                  onChange={(val) => onAnswerChange(question.id, val)}
                  allAnswers={answers}
                />
              ))}
            </div>

            {/* Line items breakdown */}
            {lineItems.length > 0 && (
              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">Cost Breakdown</h4>
                <div className="space-y-2">
                  {lineItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.description}
                        {item.quantity > 0 && item.unit && (
                          <span className="ml-1">
                            ({item.quantity} {item.unit} × {formatCurrency(item.unitPrice)})
                          </span>
                        )}
                      </span>
                      <span className="font-medium">{formatCurrency(item.total)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-medium border-t pt-2">
                    <span>Module Subtotal</span>
                    <span className="text-primary">{formatCurrency(subtotal)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
