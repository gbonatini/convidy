import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface MessageEditorProps {
  content: string;
  onChange: (content: string) => void;
  previewData: {
    nome: string;
    evento: string;
    data: string;
    local: string;
    link: string;
    empresa: string;
  };
}

export default function MessageEditor({ content, onChange, previewData }: MessageEditorProps) {
  const [preview, setPreview] = useState("");

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return "Bom dia";
    if (hour >= 12 && hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  useEffect(() => {
    const variables = {
      ...previewData,
      saudacao: getGreeting()
    };

    let processedContent = content;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      processedContent = processedContent.replace(regex, value);
    });

    setPreview(processedContent);
  }, [content, previewData]);

  const availableVariables = [
    { key: "nome", label: "Nome", description: "Nome do convidado" },
    { key: "evento", label: "Evento", description: "Nome do evento" },
    { key: "data", label: "Data", description: "Data do evento" },
    { key: "local", label: "Local", description: "Local do evento" },
    { key: "link", label: "Link", description: "Link de confirmação" },
    { key: "empresa", label: "Empresa", description: "Nome da empresa" },
    { key: "saudacao", label: "Saudação", description: "Bom dia/tarde/noite (automático)" }
  ];

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('message-content') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + `{${variable}}` + content.substring(end);
      onChange(newContent);
      
      // Restore cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length + 2, start + variable.length + 2);
      }, 0);
    }
  };

  const characterCount = content.length;
  const whatsappLimit = 4096;

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="message-content">Mensagem Personalizada</Label>
        <Textarea
          id="message-content"
          value={content}
          onChange={(e) => onChange(e.target.value)}
          rows={8}
          placeholder="Digite sua mensagem personalizada aqui..."
          className="mt-1"
        />
        <div className="flex justify-between items-center mt-1">
          <p className="text-sm text-muted-foreground">
            Use as variáveis abaixo para personalizar sua mensagem
          </p>
          <p className={`text-sm ${characterCount > whatsappLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
            {characterCount}/{whatsappLimit} caracteres
          </p>
        </div>
      </div>

      <div>
        <Label>Variáveis Disponíveis</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {availableVariables.map((variable) => (
            <Badge
              key={variable.key}
              variant="outline"
              className="cursor-pointer hover:bg-accent"
              onClick={() => insertVariable(variable.key)}
              title={variable.description}
            >
              {`{${variable.key}}`}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Clique em uma variável para inseri-la na mensagem
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Preview da Mensagem</CardTitle>
          <CardDescription>
            Veja como ficará a mensagem final para {previewData.nome}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap text-sm">
            {preview || "Digite uma mensagem para ver o preview..."}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}