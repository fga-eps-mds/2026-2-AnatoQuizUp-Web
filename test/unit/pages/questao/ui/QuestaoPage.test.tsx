jest.mock("../../../../../src/app/providers/AuthProvider", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../../../../src/features/manage-questions/model/questionService", () => ({
  listProfessorQuestions: jest.fn(),
  createQuestion: jest.fn(),
  updateQuestion: jest.fn(),
  deleteQuestion: jest.fn(),
}));

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { useAuth } from "../../../../../src/app/providers/AuthProvider";
import {
  createQuestion,
  deleteQuestion,
  listProfessorQuestions,
  updateQuestion,
} from "../../../../../src/features/manage-questions/model/questionService";
import type { ProfessorQuestion } from "../../../../../src/features/manage-questions/model/types";
import type { User } from "../../../../../src/entities/user/model/types";
import { QuestionsPage } from "../../../../../src/pages/questao/ui/QuestaoPage";

const useAuthMock = useAuth as jest.Mock;
const listProfessorQuestionsMock = listProfessorQuestions as jest.Mock;
const createQuestionMock = createQuestion as jest.Mock;
const deleteQuestionMock = deleteQuestion as jest.Mock;
const updateQuestionMock = updateQuestion as jest.Mock;

const professor: User = {
  id: "professor-1",
  name: "Joana Batista",
  email: "joana@unb.br",
  role: "PROFESSOR",
  status: "ACTIVE",
  authProvider: "LOCAL",
};

const questions: ProfessorQuestion[] = [
  {
    id: "question-14",
    topic: "Imagem",
    tags: ["radiografia"],
    type: "Múltipla escolha",
    statement: "Em uma radiografia de tórax, qual o sinal radiológico que diferencia atelectasia de consolidação pulmonar?",
    difficulty: "Médio",
    origemQuestao: "PROVA_ANTERIOR",
    taxonomiaBloom: "ANALISAR",
    regiaoAnatomica: "Tórax",
    createdAt: "31/03/2025",
    explanation: "Explicação padrão",
    alternatives: [
      { id: "a", label: "A", text: "Broncograma aéreo", isCorrect: false },
      { id: "b", label: "B", text: "Perda de volume pulmonar", isCorrect: true },
      { id: "c", label: "C", text: "Opção C", isCorrect: false },
      { id: "d", label: "D", text: "Opção D", isCorrect: false },
      { id: "e", label: "E", text: "Opção E", isCorrect: false },
      { id: "f", label: "F", text: "Opção extra", isCorrect: false }, 
    ],
  },
  {
    id: "question-15",
    topic: "Imagem",
    tags: ["eco"],
    type: "Múltipla escolha",
    statement: "Na ecocardiografia, qual janela acústica permite melhor visualização do septo interventricular em seu terço médio?",
    difficulty: "Difícil",
    origemQuestao: "ELABORADA_POR_PROFESSOR",
    taxonomiaBloom: "LEMBRAR",
    regiaoAnatomica: "Tórax",
    createdAt: "30/03/2025",
    explanation: "Explicação padrão",
    alternatives: [
      { id: "a", label: "A", text: "Paraesternal eixo curto", isCorrect: true },
      { id: "b", label: "B", text: "Subcostal", isCorrect: false },
      { id: "c", label: "C", text: "Opção C", isCorrect: false },
      { id: "d", label: "D", text: "Opção D", isCorrect: false },
    ],
  },
  {
    id: "question-16",
    topic: "Tórax",
    tags: ["aorta"],
    type: "Múltipla escolha",
    statement: "Qual estrutura anatômica dá origem ao arco aórtico?",
    difficulty: "Fácil",
    origemQuestao: "ELABORADA_POR_PROFESSOR",
    taxonomiaBloom: "LEMBRAR",
    regiaoAnatomica: "Tórax",
    createdAt: "01/04/2025",
    explanation: "Explicação padrão",
    alternatives: [
      { id: "a", label: "A", text: "Ventrículo esquerdo", isCorrect: true },
      { id: "b", label: "B", text: "Átrio direito", isCorrect: false },
      { id: "c", label: "C", text: "Opção C", isCorrect: false },
      { id: "d", label: "D", text: "Opção D", isCorrect: false },
      { id: "e", label: "E", text: "Opção E", isCorrect: false },
    ],
  },
];

const renderQuestionsPage = (openCreateModal = false) => render(
  <MemoryRouter initialEntries={[openCreateModal ? "/professor/criar-questao" : "/professor/questoes"]}>
    <QuestionsPage openCreateModal={openCreateModal} />
  </MemoryRouter>,
);

// Esses cenários verificam validação e envio, sem depender de cada tecla digitada.
// Colar o texto preserva os eventos de entrada e evita renderizações por caractere.
const fillText = async (
  user: ReturnType<typeof userEvent.setup>,
  input: HTMLElement,
  value: string,
) => {
  await user.click(input);
  await user.paste(value);
};

describe("QuestionsPage", () => {
  beforeAll(() => {
    global.URL.createObjectURL = jest.fn(() => "mocked-url");
  });

  beforeEach(() => {
    useAuthMock.mockReturnValue({
      user: professor,
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
    });
    listProfessorQuestionsMock.mockResolvedValue(questions);
    createQuestionMock.mockImplementation(async (values) => ({
      id: "question-17",
      createdAt: "01/04/2025",
      tags: [],
      ...values,
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the question bank summary and professor identity", async () => {
    renderQuestionsPage();

    expect(
      screen.getByRole("heading", { name: /Banco de Questões/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Professor")).toBeInTheDocument();
    expect(screen.getByLabelText(/Usuário Joana Batista/i)).toHaveTextContent(
      "JB",
    );
    expect(await screen.findByText(/3 questões cadastradas/i)).toBeInTheDocument();
    expect(listProfessorQuestionsMock).toHaveBeenCalledTimes(1);
  });

  it("filters questions by search term", async () => {
    const testUser = userEvent.setup();

    renderQuestionsPage();

    const search = await screen.findByRole("textbox", { name: /Buscar questão/i });
    expect(screen.getByText(/atelectasia/i)).toBeInTheDocument();

    await testUser.clear(search);
    await testUser.type(search, "ecocardiografia");

    expect(screen.getByText(/janela acústica/i)).toBeInTheDocument();
    expect(screen.queryByText(/atelectasia/i)).not.toBeInTheDocument();
    expect(screen.getByText("1 resultado(s)")).toBeInTheDocument();
  });

  it("mantém a busca focada e permite recuperar a lista após nenhum resultado", async () => {
    const testUser = userEvent.setup();
    listProfessorQuestionsMock.mockImplementation(async (params) => (
      params?.tema === "termo-inexistente" ? [] : questions
    ));

    renderQuestionsPage();

    const search = await screen.findByRole("textbox", { name: /Buscar questão/i });
    listProfessorQuestionsMock.mockClear();

    await testUser.type(search, "termo-inexistente");

    expect(search).toHaveFocus();
    expect(listProfessorQuestionsMock).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(listProfessorQuestionsMock).toHaveBeenCalledTimes(1);
      expect(listProfessorQuestionsMock).toHaveBeenCalledWith(
        expect.objectContaining({ tema: "termo-inexistente" }),
      );
    });

    expect(await screen.findByText("Nenhuma questão encontrada")).toBeInTheDocument();
    expect(search).toBeInTheDocument();
    expect(search).toHaveFocus();

    await testUser.clear(search);

    await waitFor(() => {
      expect(listProfessorQuestionsMock).toHaveBeenLastCalledWith(undefined);
    });
    expect(await screen.findByText(/atelectasia/i)).toBeInTheDocument();
    expect(search).toHaveFocus();
  });

  it("filters questions by topic and difficulty", async () => {
    const testUser = userEvent.setup();

    renderQuestionsPage();

    await screen.findByText(/atelectasia/i);

    await testUser.selectOptions(screen.getByRole("combobox", { name: /Filtrar por tema/i }), "Tórax");

    expect(screen.getByText(/arco aórtico/i)).toBeInTheDocument();
    expect(screen.queryByText(/atelectasia/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/janela acústica/i)).not.toBeInTheDocument();
    expect(screen.getByText("1 resultado(s)")).toBeInTheDocument();

    await testUser.selectOptions(screen.getByRole("combobox", { name: /Filtrar por tema/i }), "all");
    await testUser.selectOptions(screen.getByRole("combobox", { name: /Filtrar por dificuldade/i }), "Difícil");

    expect(screen.getByText(/janela acústica/i)).toBeInTheDocument();
    expect(screen.queryByText(/atelectasia/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/arco aórtico/i)).not.toBeInTheDocument();
    expect(screen.getByText("1 resultado(s)")).toBeInTheDocument();
  });

  it("keeps save disabled until required fields are filled and then creates a question", async () => {
    const testUser = userEvent.setup();

    renderQuestionsPage(true);

    expect(await screen.findByRole("dialog", { name: /Nova questão/i })).toBeInTheDocument();
    await fillText(testUser, screen.getByRole("textbox", { name: /Tags/i }), "teste");
    await testUser.selectOptions(screen.getByRole("combobox", { name: /Nível cognitivo \(Bloom\)/i }), "LEMBRAR");
    await fillText(testUser, screen.getByRole("textbox", { name: /Região anatômica/i }), "Tórax");
    await testUser.click(screen.getByRole("button", { name: /Próximo/i }));

    const statement = screen.getByRole("textbox", { name: /Enunciado da questão/i });
    expect(screen.getByRole("button", { name: /Próximo/i })).toBeDisabled();

    await fillText(testUser, statement, "Pergunta obrigatória?");
    
    await fillText(testUser, screen.getByPlaceholderText(/Explique a resposta correta/i), "Explicação teste");
    
    await testUser.click(screen.getByRole("button", { name: /Próximo/i }));

    const saveButton = screen.getByRole("button", { name: /Salvar questão/i });
    expect(saveButton).toBeDisabled();

    fireEvent.change(screen.getByRole("textbox", { name: /Texto da alternativa A/i }), {
      target: { value: "Esterno" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /Texto da alternativa B/i }), {
      target: { value: "Manúbrio" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /Texto da alternativa C/i }), {
      target: { value: "Clavícula" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /Texto da alternativa D/i }), {
      target: { value: "Escápula" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /Texto da alternativa E/i }), {
      target: { value: "Primeira costela" },
    });
    await testUser.click(screen.getByRole("radio", { name: /Marcar alternativa B como correta/i }));

    expect(saveButton).toBeEnabled();
    await testUser.click(saveButton);

    await waitFor(() => {
      expect(createQuestionMock).toHaveBeenCalledWith(
        expect.objectContaining({
          topic: "Tórax",
          statement: "Pergunta obrigatória?",
        }),
      );
    });
    expect(await screen.findByText("Questão cadastrada com sucesso!")).toBeInTheDocument();
  });

  it("envia os campos de classificacao preenchidos no Step 1 ao criar", async () => {
    const testUser = userEvent.setup();
    renderQuestionsPage(true);

    expect(await screen.findByRole("dialog", { name: /Nova questão/i })).toBeInTheDocument();
    
    await fillText(testUser, screen.getByRole("textbox", { name: /Tags/i }), "teste");
    await testUser.selectOptions(
      screen.getByRole("combobox", { name: /Nível cognitivo \(Bloom\)/i }),
      "ANALISAR",
    );
    await fillText(testUser, screen.getByRole("textbox", { name: /Região anatômica/i }), "Tórax");
    
    await testUser.click(screen.getByRole("button", { name: /Próximo/i }));
    
    await fillText(
      testUser,
      screen.getByRole("textbox", { name: /Enunciado da questão/i }),
      "Pergunta com classificacao?",
    );
    await fillText(testUser, screen.getByPlaceholderText(/Explique a resposta correta/i), "Explicação teste");
    
    await testUser.click(screen.getByRole("button", { name: /Próximo/i }));

    fireEvent.change(screen.getByRole("textbox", { name: /Texto da alternativa A/i }), { target: { value: "A" } });
    fireEvent.change(screen.getByRole("textbox", { name: /Texto da alternativa B/i }), { target: { value: "B" } });
    fireEvent.change(screen.getByRole("textbox", { name: /Texto da alternativa C/i }), { target: { value: "C" } });
    fireEvent.change(screen.getByRole("textbox", { name: /Texto da alternativa D/i }), { target: { value: "D" } });
    fireEvent.change(screen.getByRole("textbox", { name: /Texto da alternativa E/i }), { target: { value: "E" } });
    await testUser.click(screen.getByRole("radio", { name: /Marcar alternativa A como correta/i }));

    await testUser.click(screen.getByRole("button", { name: /Salvar questão/i }));

    await waitFor(() => {
      expect(createQuestionMock).toHaveBeenCalledWith(
        expect.objectContaining({
          taxonomiaBloom: "ANALISAR",
          regiaoAnatomica: "Tórax",
        }),
      );
    });
  });

  it("filtra questoes por nivel cognitivo (Bloom) via API", async () => {
    const testUser = userEvent.setup();
    renderQuestionsPage();

    await screen.findByText(/atelectasia/i);
    listProfessorQuestionsMock.mockClear();

    await testUser.selectOptions(
      screen.getByRole("combobox", { name: /Filtrar por nível cognitivo/i }),
      "ANALISAR",
    );

    await waitFor(() => {
      expect(listProfessorQuestionsMock).toHaveBeenCalledWith(
        expect.objectContaining({ taxonomiaBloom: "ANALISAR" }),
      );
    });
  });

  it("handles image upload, preview and removal correctly", async () => {
    const testUser = userEvent.setup();
    renderQuestionsPage(true);

    await testUser.type(screen.getByRole("textbox", { name: /Tags/i }), "teste");
    await testUser.selectOptions(screen.getByRole("combobox", { name: /Nível cognitivo \(Bloom\)/i }), "LEMBRAR");
    await testUser.type(screen.getByRole("textbox", { name: /Região anatômica/i }), "Tórax");

    await testUser.click(screen.getByRole("button", { name: /Próximo/i }));
    await screen.findByRole("textbox", { name: /Enunciado da questão/i });
    const fileInput = document.getElementById("image-upload") as HTMLInputElement;
    expect(fileInput).not.toBeNull();

    const validFile = new File(["dummy content"], "anatomia.png", { type: "image/png" });

    await testUser.upload(fileInput, validFile);

    const previewImage = await screen.findByAltText("Preview da imagem");
    expect(previewImage).toBeInTheDocument();
    expect(previewImage).toHaveAttribute("src", "mocked-url");

    const removeButton = screen.getByRole("button", { name: /Remover imagem/i });
    await testUser.click(removeButton);

    expect(screen.queryByAltText("Preview da imagem")).not.toBeInTheDocument();
    expect(screen.getByText(/Clique para adicionar imagem/i)).toBeInTheDocument();
  });

  it("prevents uploading an image larger than 5MB and shows alert", async () => {
    const testUser = userEvent.setup();
    renderQuestionsPage(true);

    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});

    await testUser.type(screen.getByRole("textbox", { name: /Tags/i }), "teste");
    await testUser.selectOptions(screen.getByRole("combobox", { name: /Nível cognitivo \(Bloom\)/i }), "LEMBRAR");
    await testUser.type(screen.getByRole("textbox", { name: /Região anatômica/i }), "Tórax");

    await testUser.click(screen.getByRole("button", { name: /Próximo/i }));
    await screen.findByRole("textbox", { name: /Enunciado da questão/i });

    const fileInput = document.getElementById("image-upload") as HTMLInputElement;

    const bigFile = new File(["dummy"], "big-image.jpg", { type: "image/jpeg" });
    Object.defineProperty(bigFile, "size", { value: 6 * 1024 * 1024 }); 

    await testUser.upload(fileInput, bigFile);

    expect(alertSpy).toHaveBeenCalledWith("A imagem deve ter no máximo 5MB");
    expect(screen.queryByAltText("Preview da imagem")).not.toBeInTheDocument();

    alertSpy.mockRestore();
  });

  it("opens a confirmation modal before deleting a question", async () => {
    const testUser = userEvent.setup();
    deleteQuestionMock.mockResolvedValueOnce(undefined);

    renderQuestionsPage();

    const row = (await screen.findByText(/atelectasia/i)).closest("tr");
    expect(row).not.toBeNull();

    await testUser.click(within(row as HTMLTableRowElement).getByRole("button", { name: /Excluir/i }));

    expect(screen.getByRole("dialog", { name: /Excluir questão/i })).toBeInTheDocument();
    await testUser.click(screen.getAllByRole("button", { name: /Excluir/i }).at(-1) as HTMLButtonElement);

    await waitFor(() => {
      expect(deleteQuestionMock).toHaveBeenCalledWith("question-14");
    });
    expect(screen.queryByText(/atelectasia/i)).not.toBeInTheDocument();
  });

  describe("Edge Cases, Error Handling and Modal Navigation", () => {
    it("handles load error as an Error instance", async () => {
      listProfessorQuestionsMock.mockRejectedValueOnce(new Error("Erro simulado de rede"));
      renderQuestionsPage();
      expect(await screen.findByText("Erro simulado de rede")).toBeInTheDocument();
    });

    it("handles load error as a non-Error fallback", async () => {
      listProfessorQuestionsMock.mockRejectedValueOnce({ status: 500 });
      renderQuestionsPage();
      expect(await screen.findByText("Nao foi possivel carregar as questões.")).toBeInTheDocument();
    });

    it("does not update state if unmounted during load", async () => {
      let resolver: (questions: ProfessorQuestion[]) => void;
      listProfessorQuestionsMock.mockReturnValueOnce(new Promise((res) => { resolver = res; }));
      
      const { unmount } = renderQuestionsPage();
      unmount(); 
      
      resolver!(questions);
      await new Promise(process.nextTick);
      expect(screen.queryByText(/atelectasia/i)).not.toBeInTheDocument();
    });

    it("cancels question deletion modal", async () => {
      const testUser = userEvent.setup();
      renderQuestionsPage();

      const row = (await screen.findByText(/atelectasia/i)).closest("tr");
      await testUser.click(within(row as HTMLTableRowElement).getByRole("button", { name: /Excluir/i }));
      
      expect(screen.getByRole("dialog", { name: /Excluir questão/i })).toBeInTheDocument();
      
      await testUser.click(screen.getByRole("button", { name: /Cancelar/i }));
      
      expect(screen.queryByRole("dialog", { name: /Excluir questão/i })).not.toBeInTheDocument();
    });

    it("handles non-Error rejection when deleting a question", async () => {
      const testUser = userEvent.setup();
      deleteQuestionMock.mockRejectedValueOnce({ erro: "desconhecido" }); 
      
      renderQuestionsPage();

      const row = (await screen.findByText(/atelectasia/i)).closest("tr");
      await testUser.click(within(row as HTMLTableRowElement).getByRole("button", { name: /Excluir/i }));
      
      const dialog = await screen.findByRole("dialog", { name: /Excluir questão/i });
      await testUser.click(within(dialog).getByRole("button", { name: /Excluir/i }));

      expect(await screen.findByText("Nao foi possivel excluir a questão.")).toBeInTheDocument();
    });

    it("edits an existing question, removes alternative, and saves", async () => {
      const testUser = userEvent.setup();
      updateQuestionMock.mockResolvedValueOnce({ ...questions[0] });

      renderQuestionsPage();

      const row = (await screen.findByText(/atelectasia/i)).closest("tr");
      await testUser.click(within(row as HTMLTableRowElement).getByRole("button", { name: /Editar/i }));

      expect(await screen.findByRole("dialog", { name: /Editar questão/i })).toBeInTheDocument();

      // Edição carrega os campos de classificação da questão existente
      expect(screen.getByRole("combobox", { name: /Nível cognitivo \(Bloom\)/i })).toHaveValue("ANALISAR");
      expect(screen.getByRole("textbox", { name: /Região anatômica/i })).toHaveValue("Tórax");

      await testUser.click(screen.getByRole("button", { name: /Próximo/i }));
      await screen.findByRole("textbox", { name: /Enunciado da questão/i });

      const backButton = await screen.findByRole("button", { name: /Voltar|Anterior/i });
      await testUser.click(backButton);
      
      await waitFor(() => {
        expect(screen.queryByRole("textbox", { name: /Enunciado da questão/i })).not.toBeInTheDocument();
      });

      await testUser.click(screen.getByRole("button", { name: /Próximo/i }));
      await screen.findByRole("textbox", { name: /Enunciado da questão/i });

      await testUser.click(screen.getByRole("button", { name: /Próximo/i }));
      
      const removeButtons = await screen.findAllByRole("button", { name: /Remover alternativa/i });
      expect(removeButtons.length).toBeGreaterThan(0);
      
      await testUser.click(removeButtons[0]);

      const saveBtn = await screen.findByRole("button", { name: /Salvar questão/i });
      expect(saveBtn).toBeEnabled();
      await testUser.click(saveBtn);

      await waitFor(() => {
        expect(updateQuestionMock).toHaveBeenCalledWith("question-14", expect.anything());
      });
      
      expect(await screen.findByText("Questão atualizada com sucesso!")).toBeInTheDocument();
    });

    it("adds an alternative and then closes the modal", async () => {
      const testUser = userEvent.setup();

      renderQuestionsPage();

      const row = (await screen.findByText(/janela acústica/i)).closest("tr");
      await testUser.click(within(row as HTMLTableRowElement).getByRole("button", { name: /Editar/i }));

      await testUser.click(screen.getByRole("button", { name: /Próximo/i }));
      await screen.findByRole("textbox", { name: /Enunciado da questão/i });
      await testUser.click(screen.getByRole("button", { name: /Próximo/i }));

      const addBtn = await screen.findByRole("button", { name: /Adicionar alternativa/i });
      await testUser.click(addBtn);

      const closeBtn = screen.getByRole("button", { name: /Fechar modal/i });
      await testUser.click(closeBtn);

      await waitFor(() => {
        expect(screen.queryByRole("dialog", { name: /Editar questão/i })).not.toBeInTheDocument();
      });
    });

    it("handles non-Error rejection when saving a question", async () => {
      const testUser = userEvent.setup();
      updateQuestionMock.mockRejectedValueOnce("Erro genérico ao salvar"); 
      
      renderQuestionsPage();

      const row = (await screen.findByText(/arco aórtico/i)).closest("tr");
      await testUser.click(within(row as HTMLTableRowElement).getByRole("button", { name: /Editar/i }));
      
      expect(await screen.findByRole("dialog", { name: /Editar questão/i })).toBeInTheDocument();

      await testUser.click(screen.getByRole("button", { name: /Próximo/i }));
      await screen.findByRole("textbox", { name: /Enunciado da questão/i }); 
      
      await testUser.click(screen.getByRole("button", { name: /Próximo/i }));
      
      const saveBtn = await screen.findByRole("button", { name: /Salvar questão/i }); 
      expect(saveBtn).toBeEnabled();
      await testUser.click(saveBtn);

      expect(await screen.findByText("Não foi possível salvar a questão.")).toBeInTheDocument();
    });
  });
});
