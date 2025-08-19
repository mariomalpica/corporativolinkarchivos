import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

const ExcelManager = ({ boards, onClose, onImport }) => {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Exportar tableros a Excel
  const exportToExcel = async () => {
    setIsExporting(true);
    setError(null);
    
    try {
      // Crear un nuevo workbook
      const workbook = XLSX.utils.book_new();
      
      // Hoja de resumen de tableros
      const boardsData = boards.map(board => ({
        'ID Tablero': board.id,
        'Nombre del Tablero': board.title,
        'Color': board.color,
        'Total de Tarjetas': board.cards.length,
        'Tarjetas Completadas': board.cards.filter(card => 
          board.title.toLowerCase().includes('completado') || 
          board.title.toLowerCase().includes('terminado')
        ).length,
        'Fecha de Exportación': new Date().toLocaleDateString('es-ES')
      }));

      const boardsSheet = XLSX.utils.json_to_sheet(boardsData);
      XLSX.utils.book_append_sheet(workbook, boardsSheet, 'Tableros');

      // Hoja de todas las tarjetas
      const allCardsData = [];
      boards.forEach(board => {
        board.cards.forEach(card => {
          allCardsData.push({
            'ID Tarjeta': card.id,
            'Título': card.title,
            'Descripción': card.description || '',
            'Tablero': board.title,
            'Estado del Tablero': board.title,
            'Asignado a': card.assignedTo || '',
            'Creado por': card.createdBy || '',
            'Fecha de Creación': card.createdAt ? new Date(card.createdAt).toLocaleDateString('es-ES') : '',
            'Fecha de Vencimiento': card.dueDate ? new Date(card.dueDate).toLocaleDateString('es-ES') : '',
            'Color de Fondo': card.backgroundColor || '',
            'Vencida': card.dueDate ? (new Date(card.dueDate) < new Date() ? 'Sí' : 'No') : 'N/A'
          });
        });
      });

      const cardsSheet = XLSX.utils.json_to_sheet(allCardsData);
      XLSX.utils.book_append_sheet(workbook, cardsSheet, 'Todas las Tarjetas');

      // Crear una hoja por cada tablero
      boards.forEach(board => {
        const boardCardsData = board.cards.map(card => ({
          'ID': card.id,
          'Título': card.title,
          'Descripción': card.description || '',
          'Asignado a': card.assignedTo || '',
          'Creado por': card.createdBy || '',
          'Fecha de Creación': card.createdAt ? new Date(card.createdAt).toLocaleDateString('es-ES') : '',
          'Fecha de Vencimiento': card.dueDate ? new Date(card.dueDate).toLocaleDateString('es-ES') : '',
          'Color de Fondo': card.backgroundColor || '',
          'Estado': card.dueDate ? (new Date(card.dueDate) < new Date() ? 'Vencida' : 'Pendiente') : 'Sin fecha'
        }));

        if (boardCardsData.length > 0) {
          const sheet = XLSX.utils.json_to_sheet(boardCardsData);
          // Limpiar el nombre del tablero para usarlo como nombre de hoja
          const sheetName = board.title.replace(/[\\/:*?"<>|]/g, '').substring(0, 31);
          XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
        }
      });

      // Generar el archivo Excel
      const fileName = `Tableros_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      setImportResult({
        type: 'success',
        message: t('file_exported_successfully', { fileName }),
        details: t('exported_boards_cards', { boardCount: boards.length, cardCount: allCardsData.length })
      });
      
    } catch (err) {
      setError(t('export_error', { message: err.message }));
    } finally {
      setIsExporting(false);
    }
  };

  // Importar tableros desde Excel
  const importFromExcel = async (file) => {
    setIsImporting(true);
    setError(null);
    setImportResult(null);
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      
      // Buscar la hoja de tarjetas (puede ser "Todas las Tarjetas" o la primera hoja)
      let targetSheet = null;
      let sheetName = '';
      
      if (workbook.SheetNames.includes('Todas las Tarjetas')) {
        targetSheet = workbook.Sheets['Todas las Tarjetas'];
        sheetName = 'Todas las Tarjetas';
      } else if (workbook.SheetNames.includes('Tarjetas')) {
        targetSheet = workbook.Sheets['Tarjetas'];
        sheetName = 'Tarjetas';
      } else {
        targetSheet = workbook.Sheets[workbook.SheetNames[0]];
        sheetName = workbook.SheetNames[0];
      }
      
      const jsonData = XLSX.utils.sheet_to_json(targetSheet);
      
      if (jsonData.length === 0) {
        throw new Error(t('no_valid_data'));
      }
      
      // Procesar los datos importados
      const importedBoards = new Map();
      let importedCardsCount = 0;
      
      jsonData.forEach(row => {
        // Detectar las columnas (pueden variar según el formato)
        const boardName = row['Tablero'] || row['Estado del Tablero'] || row['Board'] || t('imported_board');
        const cardTitle = row['Título'] || row['Title'] || row['Titulo'] || '';
        
        if (!cardTitle) return; // Saltar filas sin título
        
        if (!importedBoards.has(boardName)) {
          importedBoards.set(boardName, {
            id: Date.now() + Math.random(),
            title: boardName,
            color: 'bg-blue-500', // Color por defecto
            cards: []
          });
        }
        
        const board = importedBoards.get(boardName);
        
        // Crear la tarjeta
        const card = {
          id: Date.now() + Math.random() + importedCardsCount,
          title: cardTitle,
          description: row['Descripción'] || row['Description'] || '',
          assignedTo: row['Asignado a'] || row['Assigned To'] || '',
          createdBy: row['Creado por'] || row['Created By'] || t('imported'),
          backgroundColor: row['Color de Fondo'] || row['Background Color'] || '#ffffff',
          createdAt: new Date().toISOString()
        };
        
        // Procesar fecha de vencimiento
        const dueDate = row['Fecha de Vencimiento'] || row['Due Date'] || row['Vencimiento'];
        if (dueDate && dueDate !== '') {
          try {
            // Intentar parsear diferentes formatos de fecha
            const date = new Date(dueDate);
            if (!isNaN(date.getTime())) {
              card.dueDate = date.toISOString();
            }
          } catch (e) {
            console.warn('No se pudo parsear la fecha:', dueDate);
          }
        }
        
        board.cards.push(card);
        importedCardsCount++;
      });
      
      // Convertir Map a Array
      const boardsArray = Array.from(importedBoards.values());
      
      if (boardsArray.length === 0) {
        throw new Error(t('no_valid_boards_processed'));
      }
      
      // Llamar al callback de importación
      onImport(boardsArray);
      
      setImportResult({
        type: 'success',
        message: t('import_completed_successfully'),
        details: t('imported_boards_cards_from_sheet', { boardCount: boardsArray.length, cardCount: importedCardsCount, sheetName })
      });
      
    } catch (err) {
      setError(t('import_error', { message: err.message }));
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        importFromExcel(file);
      } else {
        setError(t('invalid_excel_file'));
      }
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <FileSpreadsheet className="text-green-600" size={24} />
            <div>
              <h2 className="text-xl font-bold text-gray-800">{t('excel_management')}</h2>
              <p className="text-sm text-gray-600">{t('import_export_boards')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 touch-manipulation"
          >
            <X size={20} />
          </button>
        </div>

        {/* Export Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Download className="mr-2" size={20} />
            {t('export_to_excel')}
          </h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-blue-800 text-sm mb-3">
              {t('export_description')}
            </p>
            <ul className="text-blue-700 text-sm space-y-1 mb-4">
              <li>• {t('board_summary')}</li>
              <li>• {t('all_cards_one_sheet')}</li>
              <li>• {t('one_sheet_per_board')}</li>
              <li>• {t('complete_date_assignment_info')}</li>
            </ul>
            <div className="flex items-center justify-between">
              <span className="text-blue-800 text-sm font-medium">
                {t('board_card_count', { boardCount: boards.length, cardCount: boards.reduce((total, board) => total + board.cards.length, 0) })}
              </span>
              <button
                onClick={exportToExcel}
                disabled={isExporting || boards.length === 0}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 touch-manipulation"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>{t('exporting')}</span>
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    <span>{t('export_excel')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Import Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Upload className="mr-2" size={20} />
            {t('import_from_excel')}
          </h3>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-green-800 text-sm mb-3">
              {t('import_description')}
            </p>
            <ul className="text-green-700 text-sm space-y-1 mb-4">
              <li>• {t('required_columns')}</li>
              <li>• {t('optional_columns')}</li>
              <li>• {t('one_row_per_card')}</li>
            </ul>
            <button
              onClick={triggerFileSelect}
              disabled={isImporting}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 w-full justify-center touch-manipulation"
            >
              {isImporting ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>{t('importing')}</span>
                </>
              ) : (
                <>
                  <Upload size={16} />
                  <span>{t('select_excel_file')}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Results/Error Messages */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={16} />
              <div>
                <p className="text-red-800 font-medium text-sm">{t('error')}</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {importResult && (
          <div className={`mb-4 border rounded-lg p-4 ${
            importResult.type === 'success' 
              ? 'bg-green-50 border-green-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-start space-x-2">
              <CheckCircle className={`flex-shrink-0 mt-0.5 ${
                importResult.type === 'success' ? 'text-green-600' : 'text-yellow-600'
              }`} size={16} />
              <div>
                <p className={`font-medium text-sm ${
                  importResult.type === 'success' ? 'text-green-800' : 'text-yellow-800'
                }`}>
                  {importResult.message}
                </p>
                <p className={`text-sm ${
                  importResult.type === 'success' ? 'text-green-700' : 'text-yellow-700'
                }`}>
                  {importResult.details}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 text-sm mb-2">{t('recommended_excel_format')}</h4>
          <div className="overflow-x-auto">
            <table className="text-xs border border-gray-300 w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-2 py-1">{t('title')}</th>
                  <th className="border border-gray-300 px-2 py-1">{t('description')}</th>
                  <th className="border border-gray-300 px-2 py-1">{t('board')}</th>
                  <th className="border border-gray-300 px-2 py-1">{t('assigned_to')}</th>
                  <th className="border border-gray-300 px-2 py-1">{t('due_date')}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-2 py-1">{t('example_task')}</td>
                  <td className="border border-gray-300 px-2 py-1">{t('example_description')}</td>
                  <td className="border border-gray-300 px-2 py-1">{t('example_board')}</td>
                  <td className="border border-gray-300 px-2 py-1">{t('example_user')}</td>
                  <td className="border border-gray-300 px-2 py-1">2024-12-31</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExcelManager;