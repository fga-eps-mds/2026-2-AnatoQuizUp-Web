jest.mock("../../../../../src/features/manage-casos-osce/model/casoOsceService", () => ({
  criarCasoOsce: jest.fn(),
  buscarCasoOscePorId: jest.fn(),
  atualizarCasoOsce: jest.fn(),
}));

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import {
  atualizarCasoOsce,
  buscarCasoOscePorId,
  criarCasoOsce,
} from "../../../../../src/features/manage-casos-osce/model/casoOsceService";
import type { CasoOsce } from "../../../../../src/features/manage-casos-osce/model/types";
import { CasoOsceEditorPage } from "../../../../../src/pages/professor/osce/ui/CasoOsceEditorPage";

const criarCasoOsceMock = criarCasoOsce as jest.Mock;
const buscarCasoOscePorIdMock = buscarCasoOscePorId as jest.Mock;
const atualizarCasoOsceMock = atualizarCasoOsce as jest.Mock;

const casoBase: CasoOsce = {
  id: "caso-1",
  titulo: "Dor torácica",
  especialidade: "Cardiologia",
  dificuldade: "MEDIA",
  diagnosticoEsperado: "Infarto",
  local: "Pronto-socorro",
  papelEstudante: "Médico(a)",
  idadePaciente: 58,
  sexoPaciente: "Masculino",
  queixaPaciente: "Dor no peito",
  perfilPaciente: "Perfil",
  historiaSintomas: "História",
  exameFisico: "Exame",
  status: "RASCUNHO",
  exames: [],
  criadoEm: "2026-01-01T00:00:00.000Z",
};

const casoRascunhoVazio: CasoOsce = {
  ...casoBase,
  id: "caso-novo",
  titulo: null,
  especialidade: null,
  dificuldade: null,
  diagnosticoEsperado: null,
  local: null,
  papelEstudante: null,
  idadePaciente: null,
  sexoPaciente: null,
  queixaPaciente: null,
  perfilPaciente: null,
  historiaSintomas: null,
  exameFisico: null,
};

const LocationProbe = () => {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
};

const renderEditor = (initialPath: string) =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/professor/osce/novo" element={<CasoOsceEditorPage />} />
        <Route path="/professor/osce/:id/editar" element={<CasoOsceEditorPage />} />
        <Route path="/professor/osce" element={<div>Lista de casos</div>} />
      </Routes>
      <LocationProbe />
    </MemoryRouter>,
  );

describe("CasoOsceEditorPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("em /novo, cria o rascunho e redireciona para /:id/editar", async () => {
    criarCasoOsceMock.mockResolvedValue(casoRascunhoVazio);
    buscarCasoOscePorIdMock.mockResolvedValue(casoRascunhoVazio);

    renderEditor("/professor/osce/novo");

    await waitFor(() => expect(criarCasoOsceMock).toHaveBeenCalledWith({}));
    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent("/professor/osce/caso-novo/editar"),
    );
    expect(await screen.findByText("Novo caso OSCE")).toBeInTheDocument();
  });

  it("mostra erro quando falha ao criar o rascunho em /novo", async () => {
    criarCasoOsceMock.mockRejectedValue(new Error("Falha ao criar"));

    renderEditor("/professor/osce/novo");

    expect(await screen.findByRole("alert")).toHaveTextContent("Falha ao criar");
  });

  it("em /:id/editar, busca o caso e preenche o passo 1", async () => {
    buscarCasoOscePorIdMock.mockResolvedValue(casoBase);

    renderEditor("/professor/osce/caso-1/editar");

    expect(await screen.findByText("Dor torácica")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Cardiologia")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Infarto")).toBeInTheDocument();
  });

  it("mostra erro quando falha ao buscar o caso", async () => {
    buscarCasoOscePorIdMock.mockRejectedValue(new Error("Caso não encontrado"));

    renderEditor("/professor/osce/caso-x/editar");

    expect(await screen.findByRole("alert")).toHaveTextContent("Caso não encontrado");
  });

  it("percorre os 4 passos (com autosave 1-3), gerencia exames e conclui na lista", async () => {
    const user = userEvent.setup();
    buscarCasoOscePorIdMock.mockResolvedValue(casoBase);
    atualizarCasoOsceMock.mockResolvedValue(casoBase);

    renderEditor("/professor/osce/caso-1/editar");

    await screen.findByDisplayValue("Dor torácica");

    await user.clear(screen.getByPlaceholderText(/ex: cardiologia/i));
    await user.type(screen.getByPlaceholderText(/ex: cardiologia/i), "Cardiologia infantil");
    await user.click(screen.getByRole("button", { name: /próximo/i }));

    await waitFor(() =>
      expect(atualizarCasoOsceMock).toHaveBeenCalledWith(
        "caso-1",
        expect.objectContaining({ especialidade: "Cardiologia infantil" }),
      ),
    );
    // Passo 2: campo "Local" so existe na Contextualização.
    expect(await screen.findByDisplayValue("Pronto-socorro")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /voltar/i }));
    expect(await screen.findByDisplayValue("Infarto")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /próximo/i }));
    await user.click(screen.getByRole("button", { name: /próximo/i }));

    // Passo 3: campo "Perfil do paciente" so existe no Roteiro do paciente.
    expect(await screen.findByDisplayValue("Perfil")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /adicionar exame/i }));
    await user.type(screen.getByLabelText("Nome do exame 1"), "Hemograma");
    await user.type(screen.getByLabelText("Resultado do exame 1"), "Normal");
    await user.click(screen.getByRole("button", { name: /adicionar exame/i }));
    await user.click(screen.getByLabelText("Remover exame 2"));

    await user.click(screen.getByRole("button", { name: /próximo/i }));

    await waitFor(() =>
      expect(atualizarCasoOsceMock).toHaveBeenLastCalledWith(
        "caso-1",
        expect.objectContaining({ exames: [{ nome: "Hemograma", resultado: "Normal" }] }),
      ),
    );
    // Passo 4: placeholder de avaliacao, sem campos.
    expect(
      await screen.findByText(/checklist e nota \(apenas visual, sem funcionalidade\)/i),
    ).toBeInTheDocument();

    const chamadasAntesDoConcluir = atualizarCasoOsceMock.mock.calls.length;
    await user.click(screen.getByRole("button", { name: /concluir rascunho/i }));

    expect(screen.getByTestId("location")).toHaveTextContent("/professor/osce");
    // Concluir no passo 4 nao dispara autosave (passo 4 nao tem payload).
    expect(atualizarCasoOsceMock.mock.calls).toHaveLength(chamadasAntesDoConcluir);
  });

  it("cancelar salva o passo atual e volta para a lista", async () => {
    const user = userEvent.setup();
    buscarCasoOscePorIdMock.mockResolvedValue(casoBase);
    atualizarCasoOsceMock.mockResolvedValue(casoBase);

    renderEditor("/professor/osce/caso-1/editar");

    await screen.findByDisplayValue("Dor torácica");
    await user.click(screen.getByRole("button", { name: /cancelar/i }));

    await waitFor(() => expect(atualizarCasoOsceMock).toHaveBeenCalledWith("caso-1", expect.anything()));
    expect(screen.getByTestId("location")).toHaveTextContent("/professor/osce");
  });

  it("mostra erro quando o autosave falha ao avancar de passo", async () => {
    const user = userEvent.setup();
    buscarCasoOscePorIdMock.mockResolvedValue(casoBase);
    atualizarCasoOsceMock.mockRejectedValue(new Error("Falha ao salvar"));

    renderEditor("/professor/osce/caso-1/editar");

    await screen.findByDisplayValue("Dor torácica");
    await user.click(screen.getByRole("button", { name: /próximo/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Falha ao salvar");
  });
});
