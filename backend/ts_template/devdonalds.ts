import express, { Request, Response } from "express";
import { sourceMapsEnabled } from "process";
import { stringify } from "querystring";

// ==== Type Definitions, feel free to add or modify ==========================
interface cookbookEntry {
  name: string;
  type: string;
}

interface recipeSummary {
  name: string;
  cooktime: number;
  ingredients: requiredItem[];
}

interface requiredItem {
  name: string;
  quantity: number;
}

interface recipe extends cookbookEntry {
  requiredItems: requiredItem[];
}

interface ingredient extends cookbookEntry {
  cookTime: number;
}

// =============================================================================
// ==== HTTP Endpoint Stubs ====================================================
// =============================================================================
const app = express();
app.use(express.json());

// Store your recipes here!
const cookbook: Map<string,recipe | ingredient> = new Map();

// Task 1 helper (don't touch)
app.post("/parse", (req:Request, res:Response) => {
  const { input } = req.body;

  const parsed_string = parse_handwriting(input)
  if (parsed_string == null) {
    res.status(400).send("this string is cooked");
    return;
  } 
  res.json({ msg: parsed_string });
  return;
  
});

// [TASK 1] ====================================================================
// Takes in a recipeName and returns it in a form that 
const parse_handwriting = (recipeName: string): string | null | string[] => {
  if (recipeName.length == 0) 
    {
      return null;   
    };
  // Replace all - and _ with space, remove all non whitespace and alphanumeric chars, lowercases
  recipeName = recipeName.replace(/[_-]/g, ' ').replace(/[^a-zA-Z\s]/g, '').toLowerCase();
  // Splits string into array of strings based on spaces / word
  let recipeNameSplit : string[] = recipeName.split(" ");
  // Capitalises first letter of word
  recipeNameSplit = recipeNameSplit.map((word: string): string => word.charAt(0).toUpperCase() + word.slice(1));
  // removes any solo spaces/duplicate spaces
  recipeNameSplit = recipeNameSplit.filter((word:string) => word !== "");
  // rejoins array into string
  recipeName = recipeNameSplit.join(" ");
  return recipeName;
}

// [TASK 2] ====================================================================
// Endpoint that adds a CookbookEntry to your magical cookbook
app.post("/entry", (req:Request, res:Response) => {
  if (!isEntry(req.body)) {
    res.status(400).send("Not valid Entry!");
    return;
  }
  const entry: recipe | ingredient = req.body;
  if (cookbook.has(entry.name)) {
    res.status(400).send("Duplicate Entry!");
    return;
  }
  if (entry.type === "recipe" && 'requiredItems' in entry) {
    const seen: Set<string> = new Set();
    for (const item of entry.requiredItems) {
      if (seen.has(item.name)) {
        res.status(400).send("Non-Unique Required Items!");
        return;
      }
      seen.add(item.name);
    }
  } else if (entry.type === "ingredient" && 'cookTime' in entry) {
    if (entry.cookTime < 0) {
      res.status(400).send("Invalid CookTime!");
      return;
    }
  } else {
    res.status(400).send("Invalid Type!");
    return;
  }
  cookbook.set(entry.name, entry);
  res.status(200).send({});
  return;
});

const isEntry = (e: any): boolean => {
  if ('name' in e && 'type' in e && ('requiredItems' in e || 'cookTime' in e)) {
    return true;
  }
  return false;
}
// [TASK 3] ====================================================================
// Endpoint that returns a summary of a recipe that corresponds to a query name
app.get("/summary", (req:Request, res:Request) => {
  const name: string = req.query.name;
  const entry: recipe | ingredient = cookbook.get(name);
  let summary :recipeSummary = {
    name: name,
    cooktime: 0,
    ingredients: []
  };

  if (!entry || 'cookTime' in entry) {
    res.status(400).send("Invalid Input!");
    return;
  } 

  summary.name = name;
  summary.cooktime = 0;
  const ingredients: Map<string,number> = new Map();
  let reqItemArr: requiredItem[] = entry.requiredItems;
  for (const item of reqItemArr) {
    let cookbookReference: recipe | ingredient;
    if (!(cookbookReference = cookbook.get(item.name))) {
      res.status(400).send("Unknown Required Items");
      return;
    } else if ('requiredItems' in cookbookReference) {
      reqItemArr = reqItemArr.concat(cookbookReference.requiredItems.map((i: requiredItem):requiredItem => {i.quantity = i.quantity * item.quantity; return i}));
      break;
    };
    let ingredientAmount: number;
    if (!(ingredientAmount = ingredients.get(item.name))) {
      ingredients.set(item.name, item.quantity);
    } else {
      ingredients.set(item.name, item.quantity + ingredientAmount);
    };
  };

  for (const ingredient of ingredients[Symbol.iterator]()) {
    summary.ingredients.push({name: ingredient[0], quantity: ingredient[1]});
    summary.cooktime += (cookbook.get(ingredient[0]) as ingredient).cookTime;
  };
  res.status(200).send(summary);
  return;
});

// =============================================================================
// ==== DO NOT TOUCH ===========================================================
// =============================================================================
const port = 8080;
app.listen(port, () => {
  console.log(`Running on: http://127.0.0.1:8080`);
});
