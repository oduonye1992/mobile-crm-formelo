<?php
namespace commands;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

class BuildCommand extends Command
{
    protected $commandName = 'prepare';
    protected $commandDescription = "Builds the files";

    protected $commandArgumentName = "name";
    protected $commandArgumentDescription = "Who do you want to greet?";

    protected $commandOptionName = "cap"; // should be specified like "app:greet John --cap"
    protected $commandOptionDescription = 'If set, it will greet in uppercase letters';

    protected function configure(){
        $this
            ->setName($this->commandName)
            ->setDescription($this->commandDescription)
            ->addArgument(
                $this->commandArgumentName,
                InputArgument::OPTIONAL,
                $this->commandArgumentDescription
            )
            ->addOption(
                $this->commandOptionName,
                null,
                InputOption::VALUE_NONE,
                $this->commandOptionDescription
            )
        ;
    }
    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $io = new SymfonyStyle($input, $output);
        $name = $input->getArgument($this->commandArgumentName);
        if ($input->getOption($this->commandOptionName)) {
            $text = strtoupper($name);
        }
        /**
         * Get the json file
         * Fore each one
         * Get the js
         *  Store it on the scripts portion of the file, get the name
         *
         * A P P L E T   S T R U C T U R E
         * "applets" {
                "id" : {
         *          "mode": "dynamic",
         *          "pages": [
         *              layout
         *              css
         *              events {
                            ready :  "userScripts.exec('script_0')"
         *              }
         *          ]
         * }
         * }
         * "scripts" [
         *      "script_0" : "kfsdlksmlkdmfklsfs"
         *
         */

        $pages = $this->getJSON();
        $projectName = "myname";
        if (!isset($pages)){
            return $output->writeln("$pages Could not build. Check your permissions");
        }
        $config = [
            'applets' => [
                "myname" => [
                    'mode' => 'dynamic',
                    'root' => $pages->root,
                    'pages' => [

                    ],
                    'providers' => [

                    ],
                    'dependencies' => [
                        'js' => [

                        ],
                        'css' => [

                        ]
                    ]
                ]
            ],
            "scripts" => []
        ];
        $io->text("Compiling Pages");
        foreach ($pages->pages as $key){
            $html = $this->getFileContents("app/pages/$key/$key.html");
            $css = $this->getFileContents("app/pages/$key/$key.css");
            $js = $this->getFileContents("app/pages/$key/$key.js");
            // Add js to script and get the scripts blok and store its reference in the main block
            $randomString = $this->str_random();
            $config['scripts'][$randomString] = $js;
            $pageJson = [
                "layout" => $html === false ? "" : $html,
                "css" => $css === false ? "" : $css,
                "name" => $key,
                "key" => $key,
                "events" => [
                    "ready" => "userScripts.exec('$randomString')"
                ]
            ];
            $config['applets']['myname']['pages'][$key] = $pageJson;
        }
        $io->text("Compiling Providers");
        foreach ($pages->providers as $key){
            $js = $this->getFileContents("app/providers/$key.js");
            array_push($config['applets']['myname']['providers'], $js);
        }
        $io->text("Compiling Javascript Dependencies");
        foreach ($pages->dependencies->js as $key){
            $js = $this->getFileContents("app/dependencies/js/$key.js");
            array_push($config['applets']['myname']['dependencies']['js'], $js);
        }
        $io->text("Compiling CSS Dependencies");
        foreach ($pages->dependencies->css as $key){
            $js = $this->getFileContents("app/dependencies/css/$key.css");
            array_push($config['applets']['myname']['dependencies']['css'], $js);
        }
        $this->saveJSON($config, "build/formelo.manifest");
        $io->success(array("Build script has been completed.","Development server running on localhost:8020"));
        return shell_exec('php -S localhost:8020');
    }
    private function getJSON(){
        $filename = "app/pages/pages.json";
        $handle = fopen($filename, "r");
        $contents = fread($handle, filesize($filename));
        fclose($handle);
        return json_decode($contents);
    }
    private function getFileContents($filename){
        $handle = fopen($filename, "r") or die('Error opening '.$filename);
        $contents = fread($handle, filesize($filename)+1);
        fclose($handle);
        return $contents;
    }
    private function saveJSON($json, $filename = "app/pages/pages.json"){
        $handle = fopen($filename, "w");
        fwrite($handle, json_encode($json));
        fclose($handle);
    }
    private function str_random($length = 10) {
        $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $charactersLength = strlen($characters);
        $randomString = '';
        for ($i = 0; $i < $length; $i++) {
            $randomString .= $characters[rand(0, $charactersLength - 1)];
        }
        return $randomString;
    }
}

