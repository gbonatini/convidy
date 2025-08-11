import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Save } from "lucide-react";

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  is_default: boolean;
  variables: string[];
}

interface MessageTemplateManagerProps {
  onSelectTemplate: (template: MessageTemplate | null) => void;
  selectedTemplate: MessageTemplate | null;
}

export default function MessageTemplateManager({ onSelectTemplate, selectedTemplate }: MessageTemplateManagerProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [form, setForm] = useState({
    name: "",
    content: "",
    is_default: false
  });

  const defaultTemplate = `{saudacao} {nome}! 👋

🎉 Você está convidado(a) para o evento:
📌 **{evento}**
📅 **Data:** {data}
📍 **Local:** {local}

✨ Para confirmar sua presença e garantir sua vaga, clique no link abaixo:
🔗 {link}

Aguardamos você!

{empresa}`;

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    if (!profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from("message_templates")
        .select("*")
        .eq("company_id", profile.company_id)
        .order("is_default", { ascending: false });

      if (error) throw error;
      setTemplates(data || []);

      // Auto-select default template if none selected
      if (!selectedTemplate && data?.length > 0) {
        const defaultTemplate = data.find(t => t.is_default) || data[0];
        onSelectTemplate(defaultTemplate);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile?.company_id || !form.name || !form.content) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      const templateData = {
        company_id: profile.company_id,
        name: form.name,
        content: form.content,
        is_default: form.is_default,
        variables: extractVariables(form.content)
      };

      if (editingTemplate) {
        const { error } = await supabase
          .from("message_templates")
          .update(templateData)
          .eq("id", editingTemplate.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("message_templates")
          .insert(templateData);
        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: `Template ${editingTemplate ? 'atualizado' : 'criado'} com sucesso!`,
      });

      setIsDialogOpen(false);
      setEditingTemplate(null);
      setForm({ name: "", content: "", is_default: false });
      fetchTemplates();
    } catch (error) {
      console.error("Error saving template:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar template.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from("message_templates")
        .delete()
        .eq("id", templateId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Template excluído com sucesso!",
      });

      fetchTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir template.",
        variant: "destructive",
      });
    }
  };

  const extractVariables = (content: string): string[] => {
    const regex = /\{([^}]+)\}/g;
    const variables = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    return variables;
  };

  const handleEdit = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setForm({
      name: template.name,
      content: template.content,
      is_default: template.is_default
    });
    setIsDialogOpen(true);
  };

  const handleCreateDefault = () => {
    setForm({
      name: "Template Padrão",
      content: defaultTemplate,
      is_default: true
    });
    setIsDialogOpen(true);
  };

  if (loading) {
    return <div>Carregando templates...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label>Templates de Mensagem</Label>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Editar Template' : 'Novo Template'}
              </DialogTitle>
              <DialogDescription>
                Crie templates personalizados para suas mensagens de convite
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="template-name">Nome do Template</Label>
                <Input
                  id="template-name"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Template Formal"
                />
              </div>
              
              <div>
                <Label htmlFor="template-content">Conteúdo da Mensagem</Label>
                <Textarea
                  id="template-content"
                  value={form.content}
                  onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
                  rows={12}
                  placeholder="Digite sua mensagem aqui..."
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Variáveis disponíveis: {`{nome}, {evento}, {data}, {local}, {link}, {empresa}, {saudacao}`}
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is-default"
                  checked={form.is_default}
                  onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_default: checked }))}
                />
                <Label htmlFor="is-default">Definir como template padrão</Label>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Nenhum Template Criado</CardTitle>
            <CardDescription>
              Crie seu primeiro template para personalizar as mensagens de convite
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleCreateDefault}>
              Criar Template Padrão
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2 max-h-32 overflow-y-auto">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedTemplate?.id === template.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-accent'
              }`}
              onClick={() => onSelectTemplate(template)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{template.name}</div>
                  {template.is_default && (
                    <div className="text-xs text-muted-foreground">Padrão</div>
                  )}
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(template);
                    }}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(template.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}