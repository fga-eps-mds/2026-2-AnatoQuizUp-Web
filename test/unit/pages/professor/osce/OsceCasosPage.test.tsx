jest.mock("../../../../../src/features/manage-casos-osce/model/casoOsceService", () => ({
  listarCasosOsce: jest.fn(),
  excluirCasoOsce: jest.fn(),
}));

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import {
  excluirCasoOsce,
  listarCasosOsce,
} from "../../../../../src/features/manage-casos-osce/model/casoOsceService";
import type { CasoOsce } from "../../../../../src/features/manage-casos-osce/model/types";
import { OsceCasosPage } from "../../../../../src/pages/professor/osce/ui/OsceCasosPage";

const listarCasosOsceMock = listarCasosOsce as jest.Mock;
const excluirCasoOsceMock = excluirCasoOsce as jest.Mock;

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
  status: "PUBLICADO",
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
  status: "RASCUNHO",
};

const LocationProbe = () => {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
};

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/professor/osce"]}>
      <OsceCasosPage />
      <LocationProbe />
    </MemoryRouter>,
  );

describe("OsceCasosPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("lista os casos cadastrados", async () => {
    listarCasosOsceMock.mockResolvedValue([casoBase]);

    renderPage();

    expect(await screen.findByText("Dor torácica")).toBeInTheDocument();
    expect(screen.getByText("Cardiologia")).toBeInTheDocument();
  });

  it("mostra o estado vazio quando nao ha casos", async () => {
    listarCasosOsceMock.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText("Nenhum caso cadastrado")).toBeInTheDocument();
  });

  it("mostra erro quando falha ao listar os casos", async () => {
    listarCasosOsceMock.mockRejectedValue(new Error("Serviço indisponível"));

    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent("Serviço indisponível");
  });

  it("navega para a pagina do editor ao clicar em 'Novo caso'", async () => {
    const user = userEvent.setup();
    listarCasosOsceMock.mockResolvedValue([]);

    renderPage();

    await user.click(await screen.findByRole("button", { name: /novo caso/i }));

    expect(screen.getByTestId("location")).toHaveTextContent("/professor/osce/novo");
  });

  it("navega para a pagina do editor ao clicar em 'Continuar' (rascunho)", async () => {
    const user = userEvent.setup();
    listarCasosOsceMock.mockResolvedValue([casoRascunhoVazio]);

    renderPage();

    await user.click(await screen.findByRole("button", { name: /continuar/i }));

    expect(screen.getByTestId("location")).toHaveTextContent("/professor/osce/caso-novo/editar");
  });

  it("navega para a pagina do editor ao clicar em 'Ver' (publicado)", async () => {
    const user = userEvent.setup();
    listarCasosOsceMock.mockResolvedValue([casoBase]);

    renderPage();

    await user.click(await screen.findByRole("button", { name: /^ver$/i }));

    expect(screen.getByTestId("location")).toHaveTextContent("/professor/osce/caso-1/editar");
  });

  it("mostra o contador 'N casos · M publicados' e abre a confirmacao ao clicar em excluir", async () => {
    const user = userEvent.setup();
    const casoRascunho: CasoOsce = { ...casoRascunhoVazio, titulo: "Rascunho sem revisar" };
    listarCasosOsceMock.mockResolvedValue([casoBase, casoRascunho]);

    renderPage();

    expect(await screen.findByText("2 caso(s) · 1 publicado(s)")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Excluir caso Dor torácica" }));

    const dialogo = screen.getByRole("dialog");
    expect(dialogo).toHaveTextContent('Excluir o caso "Dor torácica"?');
    expect(dialogo).toHaveTextContent("As tentativas dos alunos são preservadas");
    expect(excluirCasoOsceMock).not.toHaveBeenCalled();
  });

  it("cancela a exclusao sem chamar o service", async () => {
    const user = userEvent.setup();
    listarCasosOsceMock.mockResolvedValue([casoBase]);

    renderPage();

    await user.click(await screen.findByRole("button", { name: "Excluir caso Dor torácica" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(excluirCasoOsceMock).not.toHaveBeenCalled();
    expect(screen.getByText("Dor torácica")).toBeInTheDocument();
  });

  it("confirma a exclusao: remove a linha e atualiza o contador", async () => {
    const user = userEvent.setup();
    const casoRascunho: CasoOsce = { ...casoRascunhoVazio, titulo: "Rascunho sem revisar" };
    listarCasosOsceMock.mockResolvedValue([casoBase, casoRascunho]);
    excluirCasoOsceMock.mockResolvedValue(undefined);

    renderPage();

    await user.click(await screen.findByRole("button", { name: "Excluir caso Dor torácica" }));
    await user.click(screen.getByRole("button", { name: "Excluir" }));

    await waitFor(() => expect(excluirCasoOsceMock).toHaveBeenCalledWith("caso-1"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Dor torácica")).not.toBeInTheDocument();
    expect(screen.getByText("1 caso(s) · 0 publicado(s)")).toBeInTheDocument();
  });

  it("mostra erro e mantem a confirmacao aberta quando a exclusao falha", async () => {
    const user = userEvent.setup();
    listarCasosOsceMock.mockResolvedValue([casoBase]);
    excluirCasoOsceMock.mockRejectedValue(new Error("Não foi possível excluir o caso OSCE."));

    renderPage();

    await user.click(await screen.findByRole("button", { name: "Excluir caso Dor torácica" }));
    await user.click(screen.getByRole("button", { name: "Excluir" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível excluir o caso OSCE.");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Dor torácica")).toBeInTheDocument();
  });
});
