import { fetchModuleList, fetchModulePrereqs } from "../api/moduleAPI";
import { moduleColor } from "../constants/moduleColor";
import { Requirement, Semester, PrereqTree } from "../interfaces/planner";

export const addColorToModules = (moduleRequirements: Requirement[]) => {
  return moduleRequirements.map((requirement, idx) => ({
    ...requirement,
    modules: requirement.modules.map((mod) => ({
      ...mod,
      color: moduleColor[idx % moduleColor.length],
    })),
  }));
};

export const addColorToModulesv2 = (moduleRequirements: Requirement[]) => {
  for (let i = 0; i < moduleRequirements.length; i++) {
    for (let j = 0; j < moduleRequirements[i].modules.length; j++) {
      moduleRequirements[i].modules[j].color = [];
    }
  }
  for (let i = 0; i < moduleRequirements.length; i++) {
    for (let j = 0; j < moduleRequirements[i].modules.length; j++) {
      moduleRequirements[i].modules[j].color?.push(moduleColor[i % moduleColor.length]);
    }
  }
};

export const isValidModuleCode = (code: string) => {
  return !!code.match(/[A-Z]+\d+[A-Z]*/);
};

export const applyPrereqValidation = async (
  semesters: Semester[],
): Promise<Semester[]> => {
  const takenModuleSet = new Set<string>();

  for (let i = 0; i < semesters.length; i++) {
    const preclusions: string[] = [];

    for (let j = 0; j < semesters[i].modules.length; j++) {
      let mod = semesters[i].modules[j];
      mod.prereqsViolated = [];

      // Handles modules with dropdown select
      if (mod.getUnderlyingModule) {
        const underlyingMod = mod.getUnderlyingModule();
        mod.prereqs = null;
        mod.preclusions = [];
        mod.coreqs = [];
        if (underlyingMod !== undefined) {
          const reqs = await fetchModulePrereqs(underlyingMod.code);
          mod.prereqs = reqs.prereqs;
          mod.preclusions = reqs.preclusions;
          mod.coreqs = reqs.coreqs;
        }
      } else {
        // Fetch prereqs from NUSMods if property not found
        if (mod.prereqs === undefined) {
          const reqs = await fetchModulePrereqs(mod.code);
          mod.prereqs = reqs.prereqs;
          mod.preclusions = reqs.preclusions;
          mod.coreqs = reqs.coreqs;
        }
      }

      // Prereq checking
      // Handles 2 cases:
      // module.prereqs is still undefined due to error, or module.prereqs is null (no prereqs)
      if (!!mod.prereqs) {
        mod.prereqsViolated = evaluatePrereqTreeMods(
          mod.prereqs,
          takenModuleSet,
        );
      }

      if (!!mod.preclusions) {
        preclusions.push(...mod.preclusions);
      }
      semesters[i].modules[j] = mod;
    }

    for (let j = 0; j < semesters[i].modules.length; j++) {
      const mod = semesters[i].modules[j];
      takenModuleSet.add(mod.code);
      if (!!mod.getUnderlyingModule) {
        const underlyingMod = mod.getUnderlyingModule();
        if (underlyingMod !== undefined) {
          takenModuleSet.add(underlyingMod.code);
        }
      }
    }
    preclusions.forEach((preclusion) => takenModuleSet.add(preclusion));
  }

  semesters = applyCoreqValidation(semesters);

  console.log("Apply prereq validation");
  console.log(semesters);

  return semesters;
};

// Returns true if all prerequisites are fulfilled, false otherwise.
const evaluatePrereqTree = (
  prereqTree: PrereqTree,
  moduleSet: Set<string>,
): boolean | undefined => {
  if (typeof prereqTree === "string") {
    return moduleSet.has(prereqTree);
  }
  if ("and" in prereqTree) {
    return prereqTree.and?.every((x) => evaluatePrereqTree(x, moduleSet));
  }
  if ("or" in prereqTree) {
    return prereqTree.or?.some((x) => evaluatePrereqTree(x, moduleSet));
  }
};

// Returns null if all prerequisites are fulfilled
// If not, returns in the following format:
// [["CS3243", "CS3245"],["ST2131", "ST2334", "MA2216"]]
// means ("CS3243" OR "CS3245") AND ("ST2131" OR "ST2334" OR "MA2216") required
const evaluatePrereqTreeMods = (
  prereqTree: PrereqTree,
  moduleSet: Set<string>,
): string[][] | null => {
  if (typeof prereqTree === "string") {
    return moduleSet.has(prereqTree) ? null : [[prereqTree]];
  }
  if ("and" in prereqTree) {
    const unfulfilledMods = (prereqTree.and as PrereqTree[])
      .map((x) => evaluatePrereqTreeMods(x, moduleSet)?.flat(1))
      .filter((x) => !!x) as string[][];
    return unfulfilledMods.length ? unfulfilledMods : null;
  }
  if ("or" in prereqTree) {
    const orNotFulfilled = (prereqTree.or as PrereqTree[]).every(
      (x) => !!evaluatePrereqTreeMods(x, moduleSet),
    );
    return orNotFulfilled
      ? ((prereqTree.or as PrereqTree[])
          .map((x) => evaluatePrereqTreeMods(x, moduleSet))
          .flat(1) as string[][])
      : null;
  }

  return null;
};

export const applyCoreqValidation = (semesters: Semester[]): Semester[] => {
  for (let semester of semesters) {
    const moduleSet = new Set(semester.modules.map((mod) => mod.code));
    for (let mod of semester.modules) {
      mod.coreqsViolated = [];
      if (!!mod.coreqs) {
        for (let coreq of mod.coreqs) {
          if (!moduleSet.has(coreq)) {
            mod.coreqsViolated.push(coreq);
          }
        }
      }
    }
  }
  return semesters;
};

export const testPrereqTree = async () => {
  const prereqTree = await fetchModulePrereqs("CS3243");
  const modSet = new Set<string>(["CS2040", "CS1231"]);
  if (!!prereqTree.prereqs) {
    const res = evaluatePrereqTree(prereqTree.prereqs, modSet);
    console.log(res);
  }

  return;
};

// Odd test cases:
// ACC3706: 'one of' has a 'one of'
export const testPrereqTreeMods = async () => {
  const prereqTree = await fetchModulePrereqs("CS3263");
  const modSet = new Set<string>(["CS2030", "CS1232", "ST2334"]);
  if (!!prereqTree.prereqs) {
    const res = evaluatePrereqTreeMods(prereqTree.prereqs, modSet);
    console.log(res);
  }
  return;
};

export const getNUSModsModulePage = (moduleCode: string): string =>
  "https://nusmods.com/modules/" + moduleCode;

export const getGEsFromModuleList = async (GE: string) => {
  const allModules = await fetchModuleList();
  const filteredModules = allModules.filter((mod) => mod.code.startsWith(GE));
  return filteredModules;
};

export const fetchedModuleListPromise = fetchModuleList();

// TODO: cater for cases where there are duplicates from multi-select mods
export const getNonDuplicateUEs = async (existingModules: string[]) => {
  const allModules = await fetchedModuleListPromise;
  const filteredModules = allModules.filter(
    (mod) => !existingModules.includes(mod.code),
  );
  return filteredModules;
};
