# Architecture Documentation

## System Architecture

### High-Level Architecture

```mermaid
graph TD
    A[User Application] --> B[Public API Layer]
    B --> C[parse function]
    B --> D[KaitaiStream class]

    C --> E[KSY Parser<br/>YAML → AST]
    C --> F[Type Interpreter<br/>Execute Schema]

    E --> G[Type Registry<br/>Schema Store]
    G <--> F

    F --> H[Binary Parser<br/>Stream Reader]
    F --> I[Expression Evaluator]
    F --> J[Result Builder<br/>Object Creation]

    H --> D

    style A fill:#e1f5ff
    style B fill:#b3e5fc
    style C fill:#81d4fa
    style D fill:#81d4fa
    style E fill:#4fc3f7
    style F fill:#4fc3f7
    style G fill:#29b6f6
    style H fill:#03a9f4
    style I fill:#039be5
    style J fill:#0288d1
```

### Component Relationships

```mermaid
classDiagram
    class KaitaiStream {
        -buffer: Uint8Array
        -view: DataView
        -pos: number
        +readU1() number
        +readU2le() number
        +readU4be() number
        +readStr() string
        +seek() void
    }

    class KsyParser {
        +parse(yaml: string) KsySchema
        +validate(schema: KsySchema) boolean
    }

    class TypeInterpreter {
        -schema: KsySchema
        -stream: KaitaiStream
        +parse() any
        +parseAttribute() any
        +parseType() any
    }

    class ExpressionEvaluator {
        +evaluate(expr: string, context: Context) any
        +parseExpression() AST
    }

    class Context {
        +_root: any
        +_parent: any
        +_io: KaitaiStream
    }

    TypeInterpreter --> KaitaiStream : uses
    TypeInterpreter --> ExpressionEvaluator : uses
    TypeInterpreter --> Context : creates
    KsyParser --> TypeInterpreter : provides schema
```

## Data Flow

### Parsing Flow

```mermaid
sequenceDiagram
    participant User
    participant API
    participant Parser
    participant Interpreter
    participant Stream
    participant Result

    User->>API: parse(ksy, buffer)
    API->>Parser: parseKSY(ksy)
    Parser->>Parser: Validate YAML
    Parser-->>API: Schema AST

    API->>Stream: new KaitaiStream(buffer)
    API->>Interpreter: parse(schema, stream)

    loop For each field in seq
        Interpreter->>Stream: readType()
        Stream-->>Interpreter: value
        Interpreter->>Result: addField(name, value)
    end

    Interpreter-->>API: Parsed Object
    API-->>User: Result
```

### Expression Evaluation Flow

```mermaid
flowchart TD
    A[Expression String] --> B[Lexer]
    B --> C[Token Stream]
    C --> D[Parser]
    D --> E[AST]
    E --> F[Evaluator]
    F --> G{Node Type}

    G -->|Literal| H[Return Value]
    G -->|Identifier| I[Lookup in Context]
    G -->|Binary Op| J[Evaluate Left & Right]
    G -->|Method Call| K[Execute Method]

    I --> H
    J --> H
    K --> H

    H --> L[Result]
```

## Module Structure

```mermaid
graph LR
    A[src/] --> B[stream/]
    A --> C[parser/]
    A --> D[interpreter/]
    A --> E[expression/]
    A --> F[types/]
    A --> G[utils/]

    B --> B1[KaitaiStream.ts]
    B --> B2[index.ts]

    C --> C1[KsyParser.ts]
    C --> C2[schema.ts]
    C --> C3[index.ts]

    D --> D1[TypeInterpreter.ts]
    D --> D2[Context.ts]
    D --> D3[index.ts]

    E --> E1[ExpressionEvaluator.ts]
    E --> E2[Lexer.ts]
    E --> E3[Parser.ts]
    E --> E4[index.ts]

    F --> F1[primitives.ts]
    F --> F2[index.ts]

    G --> G1[errors.ts]
    G --> G2[encoding.ts]
    G --> G3[index.ts]

    style A fill:#f9f
    style B fill:#bbf
    style C fill:#bbf
    style D fill:#bbf
    style E fill:#bbf
    style F fill:#bbf
    style G fill:#bbf
```

## Type System

```mermaid
classDiagram
    class KsySchema {
        +meta: MetaSpec
        +seq: AttributeSpec[]
        +instances: Record~string, AttributeSpec~
        +types: Record~string, KsySchema~
        +enums: Record~string, Record~string, number~~
    }

    class MetaSpec {
        +id: string
        +endian: 'le' | 'be'
        +encoding: string
        +imports: string[]
    }

    class AttributeSpec {
        +id: string
        +type: string | SwitchType
        +size: number | string
        +repeat: 'expr' | 'eos' | 'until'
        +if: string
        +encoding: string
        +enum: string
        +pos: number | string
    }

    class SwitchType {
        +switchOn: string
        +cases: Record~string, string~
    }

    KsySchema --> MetaSpec
    KsySchema --> AttributeSpec
    AttributeSpec --> SwitchType
```

## State Management

```mermaid
stateDiagram-v2
    [*] --> Initialized: new KaitaiStream(buffer)

    Initialized --> Reading: readXXX()
    Reading --> Reading: continue reading
    Reading --> Seeking: seek(pos)
    Seeking --> Reading: readXXX()

    Reading --> BitMode: readBitsInt()
    BitMode --> BitMode: continue bit reading
    BitMode --> Aligned: alignToByte()
    Aligned --> Reading: readXXX()

    Reading --> EOF: isEof() = true
    BitMode --> EOF: isEof() = true
    EOF --> [*]

    Reading --> Error: EOFError
    BitMode --> Error: EOFError
    Error --> [*]
```

## Error Handling

```mermaid
graph TD
    A[Operation] --> B{Success?}
    B -->|Yes| C[Return Result]
    B -->|No| D{Error Type}

    D -->|EOF| E[EOFError]
    D -->|Parse| F[ParseError]
    D -->|Validation| G[ValidationError]
    D -->|Not Implemented| H[NotImplementedError]
    D -->|Other| I[KaitaiError]

    E --> J[Include Position]
    F --> J
    G --> J

    J --> K[Throw Error]
    H --> K
    I --> K

    K --> L[User Catches]
```

## Phase Implementation Roadmap

```mermaid
gantt
    title Development Phases
    dateFormat YYYY-MM-DD
    section Phase 1 - MVP
    Project Setup           :done, p1_1, 2025-10-01, 1d
    KaitaiStream           :active, p1_2, 2025-10-01, 3d
    KSY Parser (Basic)     :p1_3, after p1_2, 4d
    Type Interpreter       :p1_4, after p1_3, 5d
    Basic Tests            :p1_5, after p1_2, 10d
    Documentation          :p1_6, after p1_4, 3d

    section Phase 2 - Core
    Expression Evaluator   :p2_1, after p1_6, 7d
    Conditionals & Enums   :p2_2, after p2_1, 5d
    Repetitions            :p2_3, after p2_2, 5d
    Instances              :p2_4, after p2_3, 4d
    Comprehensive Tests    :p2_5, after p2_1, 14d

    section Phase 3 - Advanced
    Substreams             :p3_1, after p2_6, 5d
    Processing             :p3_2, after p3_1, 7d
    Bit-sized Integers     :p3_3, after p3_2, 4d
    Imports                :p3_4, after p3_3, 5d
    Performance Opts       :p3_5, after p3_4, 7d
```

## Performance Considerations

```mermaid
flowchart TD
    A[Parse Request] --> B{Schema Cached?}
    B -->|Yes| C[Use Cached Schema]
    B -->|No| D[Parse YAML]
    D --> E[Cache Schema]
    E --> C

    C --> F{Instance Field?}
    F -->|Yes| G{Already Computed?}
    G -->|Yes| H[Return Cached Value]
    G -->|No| I[Compute & Cache]
    I --> H

    F -->|No| J[Read from Stream]
    J --> K[Return Value]
    H --> K

    style B fill:#ffe6e6
    style G fill:#ffe6e6
    style E fill:#e6ffe6
    style I fill:#e6ffe6
```

## Testing Strategy

```mermaid
graph TD
    A[Test Suite] --> B[Unit Tests]
    A --> C[Integration Tests]
    A --> D[Performance Tests]

    B --> B1[Stream Tests]
    B --> B2[Parser Tests]
    B --> B3[Interpreter Tests]
    B --> B4[Expression Tests]
    B --> B5[Utility Tests]

    C --> C1[Simple Formats]
    C --> C2[GIF Format]
    C --> C3[ZIP Format]
    C --> C4[ELF Format]

    D --> D1[1MB Files]
    D --> D2[10MB Files]
    D --> D3[Memory Usage]

    style A fill:#f9f
    style B fill:#bbf
    style C fill:#bfb
    style D fill:#fbb
```
