import { useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { useAppStore } from "../../core/store/useAppStore";
import { motion, AnimatePresence } from "framer-motion";

const icons = {
  success: <CheckCircle size={18} className="text-emerald-400" />,
  error: <AlertCircle size={18} className="text-red-400" />,
  info: <Info size={18} className="text-blue-400" />,
};

const styles = {
  success: "border-emerald-500/30 bg-emerald-500/10",
  error: "border-red-500/30 bg-red-500/10",
  info: "border-blue-500/30 bg-blue-500/10",
};

export function Toast() {
  const { ui, clearToast } = useAppStore();
  const toast = ui.toast;

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(clearToast, 4000);
    return () => clearTimeout(timer);
  }, [toast, clearToast]);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-xl border backdrop-blur-xl shadow-2xl ${styles[toast.type]}`}
        >
          {icons[toast.type]}
          <span className="text-sm font-medium text-white/90">{toast.message}</span>
          <button
            onClick={clearToast}
            className="ml-2 text-white/40 hover:text-white/80 transition-colors"
          >
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
