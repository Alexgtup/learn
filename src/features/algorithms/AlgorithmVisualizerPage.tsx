import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, SkipForward } from "lucide-react";
import { Button } from "../../shared/ui/Button";
import { Card } from "../../shared/ui/Card";

// === Sorting Visualizer ===
function generateArray(size: number): number[] {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 100) + 5);
}

async function bubbleSort(
  arr: number[],
  onUpdate: (arr: number[], comparing: number[], swapping: number[]) => void,
  delay: number,
  abortRef: React.MutableRefObject<boolean>
) {
  const a = [...arr];
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < a.length - i - 1; j++) {
      if (abortRef.current) return a;
      onUpdate([...a], [j, j + 1], []);
      await sleep(delay);
      if (a[j] > a[j + 1]) {
        onUpdate([...a], [], [j, j + 1]);
        await sleep(delay);
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        onUpdate([...a], [], [j, j + 1]);
        await sleep(delay);
      }
    }
  }
  onUpdate([...a], [], []);
  return a;
}

async function quickSort(
  arr: number[],
  onUpdate: (arr: number[], comparing: number[], swapping: number[]) => void,
  delay: number,
  abortRef: React.MutableRefObject<boolean>
) {
  const a = [...arr];
  
  async function qs(low: number, high: number) {
    if (low < high && !abortRef.current) {
      const pi = await partition(low, high);
      await qs(low, pi - 1);
      await qs(pi + 1, high);
    }
  }

  async function partition(low: number, high: number): Promise<number> {
    const pivot = a[high];
    let i = low - 1;
    for (let j = low; j < high && !abortRef.current; j++) {
      onUpdate([...a], [j, high], []);
      await sleep(delay);
      if (a[j] < pivot) {
        i++;
        onUpdate([...a], [], [i, j]);
        await sleep(delay);
        [a[i], a[j]] = [a[j], a[i]];
        onUpdate([...a], [], [i, j]);
        await sleep(delay);
      }
    }
    onUpdate([...a], [], [i + 1, high]);
    await sleep(delay);
    [a[i + 1], a[high]] = [a[high], a[i + 1]];
    onUpdate([...a], [], [i + 1, high]);
    await sleep(delay);
    return i + 1;
  }

  await qs(0, a.length - 1);
  if (!abortRef.current) onUpdate([...a], [], []);
  return a;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function AlgorithmVisualizerPage() {
  const [array, setArray] = useState<number[]>(generateArray(30));
  const [comparing, setComparing] = useState<number[]>([]);
  const [swapping, setSwapping] = useState<number[]>([]);
  const [algorithm, setAlgorithm] = useState<"bubble" | "quick">("bubble");
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(50);
  const abortRef = useRef(false);

  const handleUpdate = useCallback(
    (arr: number[], comp: number[], swap: number[]) => {
      setArray(arr);
      setComparing(comp);
      setSwapping(swap);
    },
    []
  );

  const startSort = useCallback(async () => {
    setRunning(true);
    abortRef.current = false;
    const delay = 200 - speed * 1.8;
    if (algorithm === "bubble") {
      await bubbleSort(array, handleUpdate, delay, abortRef);
    } else {
      await quickSort(array, handleUpdate, delay, abortRef);
    }
    setRunning(false);
  }, [algorithm, array, handleUpdate, speed]);

  const reset = useCallback(() => {
    abortRef.current = true;
    setRunning(false);
    setArray(generateArray(30));
    setComparing([]);
    setSwapping([]);
  }, []);

  return (
    <div className="section-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">🎬 Algorithm Visualizer</h2>
          <p className="text-white/50 text-sm mt-1">Визуализация алгоритмов сортировки</p>
        </div>
      </div>

      <Card className="mb-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex gap-2">
            <button
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                algorithm === "bubble"
                  ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                  : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
              }`}
              onClick={() => !running && setAlgorithm("bubble")}
            >
              Bubble Sort
            </button>
            <button
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                algorithm === "quick"
                  ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                  : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
              }`}
              onClick={() => !running && setAlgorithm("quick")}
            >
              Quick Sort
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-white/50">Скорость</span>
            <input
              type="range"
              min="1"
              max="100"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              disabled={running}
              className="w-32 accent-indigo-500"
            />
          </div>

          <div className="flex gap-2 ml-auto">
            <Button
              size="sm"
              icon={running ? <Pause size={14} /> : <Play size={14} />}
              onClick={running ? () => { abortRef.current = true; setRunning(false); } : startSort}
            >
              {running ? "Пауза" : "Старт"}
            </Button>
            <Button variant="secondary" size="sm" icon={<RotateCcw size={14} />} onClick={reset}>
              Сброс
            </Button>
          </div>
        </div>
      </Card>

      {/* Visualization */}
      <Card className="flex items-end justify-center gap-[2px] h-[400px] py-8 px-4" hover={false}>
        {array.map((value, i) => (
          <motion.div
            key={i}
            className="rounded-t-sm transition-all duration-75"
            style={{
              height: `${value * 3}px`,
              width: `${Math.max(4, (100 - array.length) * 0.5)}px`,
              background: swapping.includes(i)
                ? "#ef4444"
                : comparing.includes(i)
                ? "#f59e0b"
                : "#6366f1",
              opacity: comparing.includes(i) ? 1 : 0.8,
            }}
            layout
          />
        ))}
      </Card>

      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-[#6366f1]" />
          <span className="text-sm text-white/50">Обычный</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-[#f59e0b]" />
          <span className="text-sm text-white/50">Сравнение</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-[#ef4444]" />
          <span className="text-sm text-white/50">Обмен</span>
        </div>
      </div>
    </div>
  );
}
