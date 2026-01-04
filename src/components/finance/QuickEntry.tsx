'use client';
import { useState } from 'react';
import { X, FileText, Tag } from 'lucide-react';

interface QuickEntryProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickEntry = ({ isOpen, onClose }: QuickEntryProps) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [currency, setCurrency] = useState('BRL'); // Default a tu gasto diario

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Rendir Cuenta</h3>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:bg-slate-200"><X size={20}/></button>
        </div>

        <form className="space-y-6">
          {/* 1. Selector de Moneda y Monto */}
          <div className="bg-slate-50 p-5 rounded-3xl flex items-center gap-4 border border-slate-100 focus-within:ring-2 ring-slate-900 transition-all">
            <select 
              value={currency} 
              onChange={(e) => setCurrency(e.target.value)}
              className="bg-transparent font-black text-slate-500 outline-none text-sm cursor-pointer uppercase"
            >
              <option value="BRL">BRL (Real)</option>
              <option value="USD">USD (Dólar)</option>
              <option value="EUR">EUR (Euro)</option>
              <option value="CLP">CLP (Peso CL)</option>
              <option value="COP">COP (Peso CO)</option>
              <option value="MXN">MXN (Peso MX)</option>
            </select>
            <div className="h-8 w-px bg-slate-200"></div>
            <input 
              type="number" 
              placeholder="0.00" 
              className="bg-transparent text-4xl font-black text-slate-900 w-full outline-none placeholder:text-slate-300"
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          {/* 2. Descripción */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Descripción</label>
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-2xl mt-1">
              <FileText size={18} className="text-slate-300 shrink-0" />
              <input 
                type="text" 
                placeholder="Ej: Cena en Batel..." 
                className="w-full bg-transparent outline-none font-bold text-slate-700 placeholder:text-slate-300"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* 3. Categoría (Igual al TransactionManager) */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Categoría</label>
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-2xl mt-1 relative">
              <Tag size={18} className="text-slate-300 shrink-0" />
              <select 
                className="w-full bg-transparent outline-none font-bold text-slate-700 appearance-none cursor-pointer"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Seleccionar...</option>
                
                <optgroup label="Ingresos Operativos">
                  <option value="Sumadots - Retainer">Sumadots - Retainer</option>
                  <option value="Sumadots - Proyecto">Sumadots - Proyecto</option>
                </optgroup>

                <optgroup label="Costos de Venta">
                  <option value="Impuestos">Impuestos / Retención</option>
                  <option value="Comisiones">Comisiones Bancarias</option>
                </optgroup>

                <optgroup label="Gastos Estructurales (Chile)">
                  <option value="Deuda Bancaria">Deuda Bancaria</option>
                  <option value="Previsional">Seguros / Previsional</option>
                </optgroup>

                <optgroup label="Vida & Operación (Brasil)">
                  <option value="Vivienda">Vivienda (Alquiler)</option>
                  <option value="Supermercado">Supermercado</option>
                  <option value="Ocio">Ocio / Social</option>
                  <option value="Movilidad">Movilidad / Uber</option>
                  <option value="Educacion">Educación (MBA)</option>
                  <option value="Salud">Salud / Seguros</option>
                </optgroup>
              </select>
            </div>
          </div>

          {/* Botón Acción */}
          <button type="button" className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg mt-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-slate-200">
            REGISTRAR
          </button>
        </form>
      </div>
    </div>
  );
};