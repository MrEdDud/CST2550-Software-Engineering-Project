// using CST2550.Models;
// using Microsoft.AspNetCore.Http.HttpResults;

// namespace CST2550.Services
// {
//     public class GeometryService : IGeometryService
//     {
//         // Properties map — defines what inputs each shape requires
//         private readonly Dictionary<string, List<string>> _propertiesMap = new(StringComparer.OrdinalIgnoreCase)
//         {
//             { "Circle", new List<string> { "radius" } },
//             { "Rectangle", new List<string> { "length", "width" } },
//             { "Triangle", new List<string> { "sideA", "sideB", "sideC" } },
//             { "Square", new List<string> { "side" } },
//             { "Ellipse", new List<string> { "semiMajorAxis", "semiMinorAxis" } },
//             { "Parallelogram", new List<string> { "base", "height", "side" } },
//             { "Trapezoid", new List<string> { "topBase", "bottomBase", "height", "leftSide", "rightSide" } }
//         };
//         public List<string> GetSupportedShapes()
//         {
//             return _propertiesMap.Keys.ToList();
//         }
//         public List<string> GetShapeProperties(string shapeName)
//         {
//             if (_propertiesMap.TryGetValue(shapeName, out var properties))
//                 return properties;
//             throw new ArgumentException($"Shape '{shapeName}' is not supported.");
//         }
//         public ShapeResult Calculate(ShapeRequest request)
//         {
//             var result = new ShapeResult
//             {
//                 Shape = request.Shape,
//                 InputProperties = request.Properties
//             };
//             switch (request.Shape.ToLower())
//             {
//                 case "circle":
//                     CalculateCircle(request.Properties, result);
//                     break;
//                 case "rectangle":
//                     CalculateRectangle(request.Properties, result);
//                     break;
//                 case "triangle":
//                     CalculateTriangle(request.Properties, result);
//                     break;
//                 case "square":
//                     CalculateSquare(request.Properties, result);
//                     break;
//                 case "ellipse":
//                     CalculateEllipse(request.Properties, result);
//                     break;
//                 case "parallelogram":
//                     CalculateParallelogram(request.Properties, result);
//                     break;
//                 case "trapezoid":
//                     CalculateTrapezoid(request.Properties, result);
//                     break;
//                 default:
//                     throw new ArgumentException($"Unsupported shape: { request.Shape }");
//             }
//             // Round to 4 decimal places
//             result.Area = Math.Round(result.Area, 4);
//             result.Circumference = Math.Round(result.Circumference, 4);
//             return result;
//         }
//         private void CalculateCircle(Dictionary<string, double> props, ShapeResult result)
//         {
//             double radius = GetProperty(props, "radius");
//             result.Area = Math.PI * radius * radius;
//             result.Circumference = 2 * Math.PI * radius;
//         }
//         private void CalculateRectangle(Dictionary<string, double> props, ShapeResult result)
//         {
//             double length = GetProperty(props, "length");
//             double width = GetProperty(props, "width");
//             result.Area = length * width;
//             result.Circumference = 2 * (length + width);
//         }
//         private void CalculateTriangle(Dictionary<string, double> props, ShapeResult result)
//         {
//         double sideA = GetProperty(props, "sideA");
//                 double sideB = GetProperty(props, "sideB");
//                 double sideC = GetProperty(props, "sideC");
//                 // Heron's formula for area
//                 double s = (sideA + sideB + sideC) / 2;
//                 result.Area = Math.Sqrt(s* (s - sideA) * (s - sideB) * (s - sideC));
//         result.Circumference = sideA + sideB + sideC;
//         }
//         private void CalculateSquare(Dictionary<string, double> props, ShapeResult result)
//         {
//             double side = GetProperty(props, "side");
//             result.Area = side * side;
//             result.Circumference = 4 * side;
//         }
//         private void CalculateEllipse(Dictionary<string, double> props, ShapeResult result)
//         {
//             double semiMajor = GetProperty(props, "semiMajorAxis");
//             double semiMinor = GetProperty(props, "semiMinorAxis");
//             result.Area = Math.PI * semiMajor * semiMinor;
//             // Ramanujan's approximation for circumference
//             double h = Math.Pow(semiMajor - semiMinor, 2) /
//             Math.Pow(semiMajor + semiMinor, 2);
//             result.Circumference = Math.PI * (semiMajor + semiMinor) *
//             (1 + (3 * h) / (10 + Math.Sqrt(4 - 3 * h)));
//         }
//         private void CalculateParallelogram(Dictionary<string, double> props,
//         ShapeResult result)
//         {
//             double baseLength = GetProperty(props, "base");
//             double height = GetProperty(props, "height");
//             double side = GetProperty(props, "side");
//             result.Area = baseLength * height;
//             result.Circumference = 2 * (baseLength + side);
//         }
//         private void CalculateTrapezoid(Dictionary<string, double> props,
//         ShapeResult result)
//         {
//             double topBase = GetProperty(props, "topBase");
//             double bottomBase = GetProperty(props, "bottomBase");
            
//             double height = GetProperty(props, "height");
//             double leftSide = GetProperty(props, "leftSide");
//             double rightSide = GetProperty(props, "rightSide");
//             result.Area = 0.5 * (topBase + bottomBase) * height;
//             result.Circumference = topBase + bottomBase + leftSide +
//             rightSide;
//         }
//         private double GetProperty(Dictionary<string, double> props, string key)
//         {
//             if (!props.ContainsKey(key))
//                 throw new ArgumentException($"Missing required property: { key }");
//         if (props[key] <= 0)
//                 throw new ArgumentException($"Property '{key}' must be greater than zero.");
//         return props[key];
//         }
//     }
// }