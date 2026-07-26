import { useState, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { Play, RotateCcw, Copy, Check, Terminal } from "lucide-react";
import { Card } from "../../shared/ui/Card";
import { Button } from "../../shared/ui/Button";

const DEFAULT_CODE = `// Напиши свой код здесь
function twoSum(nums, target) {
  const map = new Map();
  
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    
    map.set(nums[i], i);
  }
  
  return [];
}

// Тест
console.log(twoSum([2, 7, 11, 15], 9));
`;

export function PlaygroundPage() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [output, setOutput] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  const runCode = useCallback(() => {
    setRunning(true);
    setOutput([]);
    
    const logs: string[] = [];
    const originalLog = console.log;
    
    console.log = (...args: any[]) => {
      logs.push(args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" "));
    };

    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function(code);
      fn();
      
      if (logs.length === 0) {
        logs.push("✅ Код выполнен успешно (нет вывода)");
      }
    } catch (err: any) {
      logs.push(`❌ Ошибка: ${err.message}`);
    } finally {
      console.log = originalLog;
      setOutput(logs);
      setRunning(false);
    }
  }, [code]);

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div className="section-page h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">🛝 Code Playground</h2>
          <p className="text-white/50 text-sm">Практикуй алгоритмы прямо в браузере</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={copied ? <Check size={14} /> : <Copy size={14} />} onClick={copyCode}>
            {copied ? "Скопировано" : "Копировать"}
          </Button>
          <Button variant="secondary" size="sm" icon={<RotateCcw size={14} />} onClick={() => setCode(DEFAULT_CODE)}>
            Сбросить
          </Button>
          <Button
            size="sm"
            icon={<Play size={14} />}
            onClick={runCode}
            loading={running}
          >
            Запустить
          </Button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        {/* Editor */}
        <Card variant="elevated" className="flex flex-col overflow-hidden" hover={false}>
          <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.06]">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <span className="ml-2 text-xs text-white/40">main.js</span>
          </div>
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language="javascript"
              theme="vs-dark"
              value={code}
              onChange={(v) => setCode(v || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "'JetBrains Mono', monospace",
                lineNumbers: "on",
                roundedSelection: false,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 16 },
              }}
            />
          </div>
        </Card>

        {/* Console */}
        <Card variant="elevated" className="flex flex-col overflow-hidden" hover={false}>
          <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.06]">
            <Terminal size={14} className="text-white/50" />
            <span className="text-xs text-white/50">Console Output</span>
          </div>
          <div className="flex-1 overflow-auto p-4 font-mono text-sm">
            {output.length === 0 ? (
              <span className="text-white/30 italic">Нажмите "Запустить" для выполнения кода...</span>
            ) : (
              output.map((line, i) => (
                <div key={i} className="py-0.5 text-white/80">
                  <span className="text-white/30 mr-2">{">"}</span>
                  {line}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
