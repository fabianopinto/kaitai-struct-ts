# Architecture Documentation

## System Architecture

### High-Level Architecture

```mermaid
graph TD
    A[User Application] --> B[Public API Layer]
    B --> C[parse function]
    B --> D[parseStreaming function]
    B --> E[KaitaiStream class]

    C --> F[KSY Parser<br/>YAML → AST]
    C --> G[Type Interpreter<br/>Execute Schema]
    D --> F
    D --> H[Streaming Interpreter<br/>Progressive Parsing]

    F --> I[Type Registry<br/>Schema Store]
    I <--> G
    I <--> H

    G --> J[Binary Parser<br/>Stream Reader]
    G --> K[Expression Evaluator]
    G --> L[Result Builder<br/>Object Creation]

    H --> M[Streaming Stream<br/>Async Reader]
    H --> K
    H --> N[Event Emitter<br/>Progress Events]

    J --> E
    M --> O[ReadableStream<br/>AsyncIterable]

    style A fill:#e1f5ff
    style B fill:#b3e5fc
    style C fill:#81d4fa
    style D fill:#81d4fa
    style E fill:#81d4fa
    style F fill:#4fc3f7
    style G fill:#4fc3f7
    style H fill:#4fc3f7
    style I fill:#29b6f6
    style J fill:#03a9f4
    style K fill:#039be5
    style L fill:#0288d1
    style M fill:#03a9f4
    style N fill:#0288d1
    style O fill:#e1f5ff
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
        +isEof() boolean
    }

    class StreamingKaitaiStream {
        -source: ReadableStream
        -buffer: Uint8Array
        -pos: number
        +readU1() Promise~number~
        +readU2le() Promise~number~
        +readStr() Promise~string~
        +close() Promise~void~
    }

    class KsyParser {
        +parse(yaml: string) KsySchema
        +parseWithImports() KsySchema
        +validate(schema: KsySchema) boolean
    }

    class TypeInterpreter {
        -schema: KsySchema
        -stream: KaitaiStream
        +parse() any
        +parseAttribute() any
        +parseType() any
    }

    class StreamingTypeInterpreter {
        -schema: KsySchema
        -stream: StreamingKaitaiStream
        +parseStreaming() AsyncGenerator~ParseEvent~
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
    StreamingTypeInterpreter --> StreamingKaitaiStream : uses
    TypeInterpreter --> ExpressionEvaluator : uses
    StreamingTypeInterpreter --> ExpressionEvaluator : uses
    TypeInterpreter --> Context : creates
    StreamingTypeInterpreter --> Context : creates
    KsyParser --> TypeInterpreter : provides schema
    KsyParser --> StreamingTypeInterpreter : provides schema
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
    A --> F[streaming/]
    A --> G[utils/]

    B --> B1[KaitaiStream.ts]
    B --> B2[StreamingKaitaiStream.ts]
    B --> B3[index.ts]

    C --> C1[KsyParser.ts]
    C --> C2[schema.ts]
    C --> C3[index.ts]

    D --> D1[TypeInterpreter.ts]
    D --> D2[Context.ts]
    D --> D3[index.ts]

    E --> E1[Evaluator.ts]
    E --> E2[Lexer.ts]
    E --> E3[Parser.ts]
    E --> E4[AST.ts]
    E --> E5[Token.ts]
    E --> E6[index.ts]

    F --> F1[StreamingTypeInterpreter.ts]
    F --> F2[index.ts]

    G --> G1[errors.ts]
    G --> G2[encoding.ts]
    G --> G3[index.ts]

    style A fill:#f9f
    style B fill:#bbf
    style C fill:#bbf
    style D fill:#bbf
    style E fill:#bbf
    style F fill:#bfb
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
    D -->|Other| H[KaitaiError]

    E --> I[Include Position]
    F --> I
    G --> I

    I --> J[Throw Error]
    H --> J

    J --> K[User Catches]
```

## Development Timeline

```mermaid
gantt
    title Project Development Timeline
    dateFormat YYYY-MM-DD

    section Core Features (v0.1-0.6)
    KaitaiStream & Parser      :done, 2025-10-01, 2025-10-05
    Type Interpreter           :done, 2025-10-05, 2025-10-08
    Expression Evaluator       :done, 2025-10-08, 2025-10-10
    Advanced Features          :done, 2025-10-10, 2025-10-12

    section Production (v0.7-0.9)
    CLI Tool                   :done, 2025-10-12, 2025-10-13
    Expression Endianness      :done, 2025-10-13, 2025-10-13
    Production Polish          :done, 2025-10-13, 2025-10-13

    section Streaming (v0.10.0)
    Streaming API Design       :done, 2025-10-13, 2025-10-13
    StreamingKaitaiStream      :done, 2025-10-13, 2025-10-13
    Streaming Interpreter      :done, 2025-10-13, 2025-10-13
    Streaming Tests            :done, 2025-10-13, 2025-10-13

    section Future (v1.0.0)
    Processing (zlib)          :2025-10-14, 7d
    Type Imports               :2025-10-21, 5d
    Performance Optimization   :2025-10-26, 5d
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
graph LR
    A[Test Suite] --> B[Unit Tests]
    A --> C[Integration Tests]
    A --> D[Performance Tests]

    B --> B1[Stream Tests]
    B --> B2[Parser Tests]
    B --> B3[Interpreter Tests]
    B --> B4[Expression Tests]
    B --> B5[Utility Tests]

    C --> C1[Basic Parsing]
    C --> C2[Expressions]
    C --> C3[Enums & Switch]
    C --> C4[Instances]
    C --> C5[CLI Tests]
    C --> C6[WAV Format]
    C --> C7[EDID Format]

    D --> D1[1MB Files]
    D --> D2[10MB Files]
    D --> D3[Memory Usage]

    style A fill:#f9f
    style B fill:#bbf
    style C fill:#bfb
    style D fill:#fbb
```
